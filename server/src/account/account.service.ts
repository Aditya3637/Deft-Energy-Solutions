import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

/**
 * DPDP self-service for the signed-in data principal: access/export, correction,
 * erasure. All methods operate on the caller's own org/user only.
 */
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  /** Profile + consent state (Right to access, summary). */
  async profile(orgId: string, email: string) {
    const [account, org] = await Promise.all([
      this.prisma.account.findUnique({
        where: { email },
        select: { email: true, consentAt: true, consentVersion: true, createdAt: true },
      }),
      this.prisma.withOrg(orgId, (tx) =>
        tx.organisation.findUnique({ where: { id: orgId }, select: { id: true, name: true, plan: true } }),
      ),
    ]);
    const user = await this.prisma.withOrg(orgId, (tx) =>
      tx.user.findFirst({ where: { email }, select: { id: true, name: true, role: true } }),
    );
    return {
      email,
      name: user?.name ?? "",
      role: user?.role ?? null,
      org,
      consentAt: account?.consentAt ?? null,
      consentVersion: account?.consentVersion ?? "",
      memberSince: account?.createdAt ?? null,
    };
  }

  /** Right to correction — update the user's display name. */
  async correctName(orgId: string, email: string, name: string) {
    await this.prisma.withOrg(orgId, (tx) => tx.user.updateMany({ where: { email }, data: { name } }));
    return { ok: true, name };
  }

  /** Right to access / portability — a full machine-readable export of the
   *  principal's identity + their workspace data. */
  async exportData(orgId: string, email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      select: { email: true, consentAt: true, consentVersion: true, createdAt: true },
    });
    const data = await this.prisma.withOrg(orgId, async (tx) => {
      const [org, users, buildings, bills, tasks, payments, collections] = await Promise.all([
        tx.organisation.findUnique({ where: { id: orgId } }),
        tx.user.findMany(),
        tx.building.findMany(),
        tx.electricityBill.findMany({ include: { diagnosis: { include: { findings: true } } } }),
        tx.task.findMany(),
        tx.electricityBill.findMany({
          where: { dueOn: { not: null } },
          select: { id: true, dueOn: true, paidAt: true, paidAmount: true, totalAmountDue: true },
        }),
        tx.collection.findMany(),
      ]);
      return { org, users, buildings, bills, tasks, payments, collections };
    });
    return {
      exportedAt: new Date().toISOString(),
      principal: account ?? { email },
      workspace: data,
      note: "Your personal data and workspace data held by Deft Energy Solutions (DPDP Act 2023).",
    };
  }

  /**
   * Right to erasure — permanently delete the principal's account, org and ALL
   * org-scoped data. Done in ONE transaction (atomic: rolls back cleanly if
   * anything is off), child rows before parents so no FK is violated.
   */
  async erase(orgId: string, email: string) {
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account || account.orgId !== orgId) throw new NotFoundException("Account not found");

    await this.prisma.withOrg(orgId, async (tx) => {
      // bill diagnoses + findings
      await tx.lossFinding.deleteMany({ where: { diagnosis: { bill: { orgId } } } });
      await tx.diagnosis.deleteMany({ where: { bill: { orgId } } });
      // collections / remittances / licenses
      await tx.collection.deleteMany({ where: { orgId } });
      await tx.remittance.deleteMany({ where: { orgId } });
      await tx.discomLicense.deleteMany({ where: { orgId } });
      // building children
      await tx.buildingZone.deleteMany({ where: { building: { orgId } } });
      await tx.equipment.deleteMany({ where: { building: { orgId } } });
      await tx.intervalReading.deleteMany({ where: { building: { orgId } } });
      // bills (after diagnoses) then buildings
      await tx.electricityBill.deleteMany({ where: { orgId } });
      await tx.building.deleteMany({ where: { orgId } });
      // alerts
      await tx.alertInstance.deleteMany({ where: { orgId } });
      await tx.alertRule.deleteMany({ where: { orgId } });
      // remaining org-scoped
      await tx.task.deleteMany({ where: { orgId } });
      await tx.document.deleteMany({ where: { orgId } });
      await tx.activityLog.deleteMany({ where: { orgId } });
      await tx.capexRequest.deleteMany({ where: { orgId } });
      await tx.ghgInventory.deleteMany({ where: { orgId } });
      await tx.extractionFeedback.deleteMany({ where: { orgId } });
      await tx.notificationPreference.deleteMany({ where: { user: { orgId } } });
      await tx.subscription.deleteMany({ where: { orgId } });
      await tx.user.deleteMany({ where: { orgId } });
      await tx.organisation.delete({ where: { id: orgId } });
    });
    // Identity index (non-RLS) last.
    await this.prisma.account.delete({ where: { email } });
    return { erased: true };
  }
}
