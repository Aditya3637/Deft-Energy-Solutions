import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { PLANS, canSaveBill, planById, type Feature, type PlanId } from "./plans";
import {
  activationFromWebhook,
  isLive,
  providerName,
  startCheckout,
  verifyRazorpaySignature,
  type CheckoutResult,
} from "./payments/provider";
import { manualCheckout } from "./payments/provider-manual";

export type BillingStatus = {
  plan: PlanId;
  planName: string;
  status: string;
  priceInr: number;
  unit: string;
  custom: boolean;
  periodEnd: string | null;
  usage: { buildings: number; savedBillsThisMonth: number };
  limits: { buildings: number; savedBillsPerMonth: number };
  features: Feature[];
};

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  plans() {
    return PLANS;
  }

  private startOfMonth(): Date {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
  }

  /** The org's current plan id (latest active Subscription, default FREE). */
  private async planId(orgId: string): Promise<PlanId> {
    const sub = await this.prisma.withOrg(orgId, (tx) =>
      tx.subscription.findFirst({ where: { status: "active" }, orderBy: { startDate: "desc" } }),
    );
    return planById(sub?.plan ?? "FREE").id;
  }

  async status(orgId: string): Promise<BillingStatus> {
    const startOfMonth = this.startOfMonth();
    const { sub, buildings, savedBillsThisMonth } = await this.prisma.withOrg(orgId, async (tx) => {
      const [sub, buildings, savedBillsThisMonth] = await Promise.all([
        tx.subscription.findFirst({ where: { status: "active" }, orderBy: { startDate: "desc" } }),
        tx.building.count(),
        tx.electricityBill.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);
      return { sub, buildings, savedBillsThisMonth };
    });

    const plan = planById(sub?.plan ?? "FREE");
    return {
      plan: plan.id,
      planName: plan.name,
      status: sub?.status ?? "active",
      priceInr: plan.priceInr,
      unit: plan.unit,
      custom: plan.custom,
      periodEnd: sub?.endDate ? sub.endDate.toISOString() : null,
      usage: { buildings, savedBillsThisMonth },
      limits: plan.limits,
      features: plan.features,
    };
  }

  /**
   * Enforce the saved-bill cap for a signed-in org. Throws 402 Payment Required
   * with the upgrade target when the plan's monthly quota is exhausted. Callers
   * skip this for anonymous (demo) requests so the free funnel stays open.
   */
  async assertCanSaveBill(orgId: string): Promise<void> {
    const used = await this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.count({ where: { createdAt: { gte: this.startOfMonth() } } }),
    );
    const gate = canSaveBill(await this.planId(orgId), used);
    if (!gate.allowed) {
      throw new HttpException(
        { error: "plan_limit", feature: "savedBills", reason: gate.reason, upgradeTo: gate.upgradeTo },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /** Begin an upgrade: a Razorpay payment link, or manual invoice instructions. */
  async checkout(orgId: string, planIdInput: string): Promise<CheckoutResult> {
    const plan = planById(planIdInput);
    if (plan.id === "FREE") {
      throw new HttpException("The Free plan needs no checkout.", HttpStatus.BAD_REQUEST);
    }
    // Enterprise is custom-priced → always the contact/invoice path.
    if (plan.custom) return manualCheckout(plan.name, 0);
    return startCheckout(orgId, plan.id, plan.priceInr, process.env.APP_URL ?? "");
  }

  /**
   * Self-activation for the MANUAL provider only (sandbox / invoice-paid-offline).
   * Refused when a live gateway is configured — paid plans there are granted only
   * by a verified webhook.
   */
  async activateManual(orgId: string, planIdInput: string): Promise<{ ok: true; plan: PlanId }> {
    if (isLive()) {
      throw new HttpException("Activation is gateway-only; pay via the checkout link.", HttpStatus.FORBIDDEN);
    }
    const plan = planById(planIdInput);
    if (plan.id === "FREE") throw new HttpException("Cannot 'activate' the Free plan.", HttpStatus.BAD_REQUEST);
    await this.activate(orgId, plan.id, plan.priceInr);
    return { ok: true, plan: plan.id };
  }

  /** Verify + process a Razorpay webhook; activate the org's plan on payment. */
  async webhook(rawBody: string, signature: string): Promise<{ ok: boolean }> {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      throw new HttpException("Invalid webhook signature.", HttpStatus.UNAUTHORIZED);
    }
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw new HttpException("Malformed webhook body.", HttpStatus.BAD_REQUEST);
    }
    const kind = String(event.event ?? "");
    const paid = kind === "payment_link.paid" || kind === "payment.captured" || kind === "order.paid";
    if (!paid) return { ok: true }; // ignore non-payment events
    const target = activationFromWebhook(event);
    if (!target) {
      this.log.warn(`Webhook ${kind} had no orgId/plan in notes — ignored`);
      return { ok: true };
    }
    const plan = planById(target.plan);
    await this.activate(target.orgId, plan.id, plan.priceInr);
    this.log.log(`Activated ${plan.id} for org ${target.orgId} via ${kind}`);
    return { ok: true };
  }

  /** Upsert the active subscription: supersede the old one, create the new period. */
  private async activate(orgId: string, plan: PlanId, amountInr: number): Promise<void> {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // monthly period
    await this.prisma.withOrg(orgId, async (tx) => {
      await tx.subscription.updateMany({ where: { status: "active" }, data: { status: "cancelled", endDate: now } });
      await tx.subscription.create({
        data: { orgId, plan, status: "active", startDate: now, endDate, billingCycle: "monthly", amountInr },
      });
    });
  }

  /** Surfaced for the (future) admin view. */
  paymentMode() {
    return { provider: providerName(), live: isLive() };
  }
}
