import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { billToFields } from "./bill-fields";
import { fullDiagnose, type ExtractedField, type FullDiagnosis } from "./engine";

@Injectable()
export class DiagnosisService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stateless run over posted fields — mirrors the frontend engine. */
  run(fields: ExtractedField[]): FullDiagnosis {
    return fullDiagnose(fields);
  }

  /**
   * Run the engine for a persisted bill and store the result: one Diagnosis
   * row + one LossFinding per detected loss (re-runnable — replaces any prior
   * diagnosis). Tenant is enforced via RLS on the bill load.
   */
  async runForBill(orgId: string, billId: string) {
    return this.prisma.withOrg(orgId, async (tx) => {
      const bill = await tx.electricityBill.findUnique({ where: { id: billId } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);

      const result = fullDiagnose(billToFields(bill));

      const existing = await tx.diagnosis.findUnique({ where: { billId } });
      if (existing) {
        await tx.lossFinding.deleteMany({ where: { diagnosisId: existing.id } });
        await tx.diagnosis.delete({ where: { id: existing.id } });
      }

      return tx.diagnosis.create({
        data: {
          billId,
          recoverableInr: Math.round(result.recoverableINR),
          opportunityInr: Math.round(result.opportunityINR),
          findings: {
            create: result.results
              .filter((r) => r.status === "loss")
              .map((r) => ({
                checkId: r.check.id,
                category: r.check.category,
                status: "LOSS" as const,
                kind: r.kind === "opportunity" ? ("OPPORTUNITY" as const) : ("RECOVERABLE" as const),
                annualInr: r.annualINR != null ? Math.round(r.annualINR) : null,
                note: r.note ?? null,
              })),
          },
        },
        include: { findings: true },
      });
    });
  }
}
