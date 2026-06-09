import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { SubmitCorrectionsDto, CorrectionItemDto } from "./dto/submit-corrections.dto";

/** Most recent rows considered when computing the accuracy view. */
const ACCURACY_WINDOW = 1000;

type FieldAgg = { seen: number; corrected: number };
/** A with/without-template slice: rows + field reads + corrections. */
type Bucket = { samples: number; fieldsSeen: number; corrections: number };
const emptyBucket = (): Bucket => ({ samples: 0, fieldsSeen: 0, corrections: 0 });

@Injectable()
export class CorrectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Log one reviewed extraction (training data + accuracy signal). */
  async record(orgId: string, dto: SubmitCorrectionsDto) {
    const correctedCount = dto.corrections.filter((c) => c.corrected).length;
    const row = await this.prisma.withOrg(orgId, (tx) =>
      tx.extractionFeedback.create({
        data: {
          orgId,
          provider: dto.provider,
          model: dto.model ?? "",
          source: dto.source,
          discom: dto.discom ?? "",
          templateApplied: dto.templateApplied ?? "",
          fieldsTotal: dto.fieldsTotal,
          fieldsFound: dto.fieldsFound,
          correctedCount,
          corrections: dto.corrections as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      }),
    );
    return { ok: true, id: row.id, correctedCount };
  }

  /**
   * Aggregate recent feedback into a per-DISCOM and per-field accuracy view.
   * "Field accuracy" = 1 − (corrections / times the field was seen). Kept in JS
   * (windowed) — a materialised rollup can replace this when volume warrants.
   */
  async accuracy(orgId: string) {
    const rows = await this.prisma.withOrg(orgId, (tx) =>
      tx.extractionFeedback.findMany({
        orderBy: { createdAt: "desc" },
        take: ACCURACY_WINDOW,
        select: {
          provider: true,
          source: true,
          discom: true,
          templateApplied: true,
          fieldsTotal: true,
          fieldsFound: true,
          correctedCount: true,
          corrections: true,
        },
      }),
    );

    type DiscomAgg = { samples: number; fields: number; corrected: number; tpl: Bucket; untpl: Bucket };
    const byDiscom = new Map<string, DiscomAgg>();
    const byField = new Map<string, FieldAgg>();
    const tplOverall = emptyBucket();
    const untplOverall = emptyBucket();
    let totalFields = 0;
    let totalCorrected = 0;

    for (const r of rows) {
      const discom = r.discom || "Unknown";
      const templated = (r.templateApplied ?? "").trim().length > 0;
      const d =
        byDiscom.get(discom) ??
        { samples: 0, fields: 0, corrected: 0, tpl: emptyBucket(), untpl: emptyBucket() };
      d.samples += 1;
      const oBucket = templated ? tplOverall : untplOverall;
      const dBucket = templated ? d.tpl : d.untpl;
      oBucket.samples += 1;
      dBucket.samples += 1;

      const items = (Array.isArray(r.corrections) ? r.corrections : []) as unknown as CorrectionItemDto[];
      for (const c of items) {
        if (!c || typeof c.fieldKey !== "string") continue;
        const seen = (c.extracted?.length ?? 0) > 0 || (c.final?.length ?? 0) > 0;
        if (!seen) continue;
        d.fields += 1;
        totalFields += 1;
        oBucket.fieldsSeen += 1;
        dBucket.fieldsSeen += 1;
        const fa = byField.get(c.fieldKey) ?? { seen: 0, corrected: 0 };
        fa.seen += 1;
        if (c.corrected) {
          fa.corrected += 1;
          d.corrected += 1;
          totalCorrected += 1;
          oBucket.corrections += 1;
          dBucket.corrections += 1;
        }
        byField.set(c.fieldKey, fa);
      }
      byDiscom.set(discom, d);
    }

    const rate = (corrected: number, seen: number) =>
      seen > 0 ? Math.round((1 - corrected / seen) * 1000) / 10 : null;
    const out = (b: Bucket) => ({
      samples: b.samples,
      corrections: b.corrections,
      accuracyPct: rate(b.corrections, b.fieldsSeen),
    });

    return {
      window: rows.length,
      overallAccuracyPct: rate(totalCorrected, totalFields),
      fieldsSeen: totalFields,
      corrections: totalCorrected,
      templated: out(tplOverall),
      untemplated: out(untplOverall),
      byDiscom: [...byDiscom.entries()]
        .map(([discom, v]) => ({
          discom,
          samples: v.samples,
          accuracyPct: rate(v.corrected, v.fields),
          corrections: v.corrected,
          templated: out(v.tpl),
          untemplated: out(v.untpl),
        }))
        .sort((a, b) => b.samples - a.samples),
      byField: [...byField.entries()]
        .map(([fieldKey, v]) => ({
          fieldKey,
          seen: v.seen,
          corrected: v.corrected,
          accuracyPct: rate(v.corrected, v.seen),
        }))
        .sort((a, b) => b.corrected - a.corrected),
    };
  }
}
