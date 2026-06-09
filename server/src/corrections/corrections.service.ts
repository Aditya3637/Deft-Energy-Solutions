import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { SubmitCorrectionsDto, CorrectionItemDto } from "./dto/submit-corrections.dto";

/** Most recent rows considered when computing the accuracy view. */
const ACCURACY_WINDOW = 1000;

type FieldAgg = { seen: number; corrected: number };

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
          fieldsTotal: true,
          fieldsFound: true,
          correctedCount: true,
          corrections: true,
        },
      }),
    );

    const byDiscom = new Map<string, { samples: number; fields: number; corrected: number }>();
    const byField = new Map<string, FieldAgg>();
    let totalFields = 0;
    let totalCorrected = 0;

    for (const r of rows) {
      const discom = r.discom || "Unknown";
      const d = byDiscom.get(discom) ?? { samples: 0, fields: 0, corrected: 0 };
      d.samples += 1;

      const items = (Array.isArray(r.corrections) ? r.corrections : []) as unknown as CorrectionItemDto[];
      for (const c of items) {
        if (!c || typeof c.fieldKey !== "string") continue;
        const seen = (c.extracted?.length ?? 0) > 0 || (c.final?.length ?? 0) > 0;
        if (!seen) continue;
        d.fields += 1;
        totalFields += 1;
        const fa = byField.get(c.fieldKey) ?? { seen: 0, corrected: 0 };
        fa.seen += 1;
        if (c.corrected) {
          fa.corrected += 1;
          d.corrected += 1;
          totalCorrected += 1;
        }
        byField.set(c.fieldKey, fa);
      }
      byDiscom.set(discom, d);
    }

    const rate = (corrected: number, seen: number) =>
      seen > 0 ? Math.round((1 - corrected / seen) * 1000) / 10 : null;

    return {
      window: rows.length,
      overallAccuracyPct: rate(totalCorrected, totalFields),
      fieldsSeen: totalFields,
      corrections: totalCorrected,
      byDiscom: [...byDiscom.entries()]
        .map(([discom, v]) => ({
          discom,
          samples: v.samples,
          accuracyPct: rate(v.corrected, v.fields),
          corrections: v.corrected,
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
