import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  DUNNING_GRACE_DAYS,
  PLANS,
  TRIAL_DAYS,
  canSaveBill,
  effectivePlanOf,
  planById,
  type Feature,
  type PlanId,
} from "./plans";
import {
  activationFromWebhook,
  isLive,
  providerName,
  startCheckout,
  verifyRazorpaySignature,
  webhookAction,
  type CheckoutResult,
} from "./payments/provider";
import { manualCheckout } from "./payments/provider-manual";
import { NotificationsService } from "../notifications/notifications.service";

export type BillingStatus = {
  plan: PlanId;
  planName: string;
  status: string;
  priceInr: number;
  unit: string;
  custom: boolean;
  periodEnd: string | null;
  trialing: boolean;
  trialDaysLeft: number | null;
  trialAvailable: boolean;
  pastDue: boolean;
  graceDaysLeft: number | null;
  usage: { buildings: number; savedBillsThisMonth: number };
  limits: { buildings: number; savedBillsPerMonth: number };
  features: Feature[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
type SubRow = { plan: string; status: string; startDate: Date; endDate: Date | null } | null;

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  plans() {
    return PLANS;
  }

  private startOfMonth(): Date {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
  }

  // active (recurring), trialing, and past_due (dunning grace) can all be in force.
  private static IN_FORCE = ["active", "trialing", "past_due"];

  /** Latest subscription row that could still be in force. */
  private latestSub(orgId: string): Promise<SubRow> {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.subscription.findFirst({
        where: { status: { in: BillingService.IN_FORCE } },
        orderBy: { startDate: "desc" },
        select: { plan: true, status: true, startDate: true, endDate: true },
      }),
    );
  }

  /** Effective plan id right now (expired trials / lapsed periods → FREE). */
  private async planId(orgId: string): Promise<PlanId> {
    return effectivePlanOf(await this.latestSub(orgId), new Date());
  }

  async status(orgId: string): Promise<BillingStatus> {
    const startOfMonth = this.startOfMonth();
    const { sub, buildings, savedBillsThisMonth, subCount } = await this.prisma.withOrg(orgId, async (tx) => {
      const [sub, buildings, savedBillsThisMonth, subCount] = await Promise.all([
        tx.subscription.findFirst({
          where: { status: { in: BillingService.IN_FORCE } },
          orderBy: { startDate: "desc" },
          select: { plan: true, status: true, startDate: true, endDate: true },
        }),
        tx.building.count(),
        tx.electricityBill.count({ where: { createdAt: { gte: startOfMonth } } }),
        tx.subscription.count(),
      ]);
      return { sub, buildings, savedBillsThisMonth, subCount };
    });

    const now = new Date();
    const planId = effectivePlanOf(sub, now);
    const plan = planById(planId);
    const inForce = planId !== "FREE";
    const trialing = inForce && sub?.status === "trialing";
    const pastDue = inForce && sub?.status === "past_due";
    const daysTo = (d: Date | null) => (d ? Math.max(0, Math.ceil((d.getTime() - now.getTime()) / DAY_MS)) : null);

    return {
      plan: plan.id,
      planName: plan.name,
      status: trialing ? "trialing" : pastDue ? "past_due" : "active",
      priceInr: plan.priceInr,
      unit: plan.unit,
      custom: plan.custom,
      periodEnd: sub?.endDate ? sub.endDate.toISOString() : null,
      trialing,
      trialDaysLeft: trialing ? daysTo(sub?.endDate ?? null) : null,
      trialAvailable: subCount === 0, // never subscribed/trialed before
      pastDue,
      graceDaysLeft: pastDue ? daysTo(sub?.endDate ?? null) : null,
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

  /** Start a no-card 14-day Pro trial. One per org, ever. */
  async startTrial(orgId: string): Promise<{ ok: true; plan: PlanId; endsAt: string }> {
    const count = await this.prisma.withOrg(orgId, (tx) => tx.subscription.count());
    if (count > 0) {
      throw new HttpException("Trial already used on this workspace.", HttpStatus.CONFLICT);
    }
    const now = new Date();
    const endDate = new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
    await this.prisma.withOrg(orgId, (tx) =>
      tx.subscription.create({
        data: { orgId, plan: "PRO", status: "trialing", startDate: now, endDate, billingCycle: "monthly", amountInr: 0 },
      }),
    );
    return { ok: true, plan: "PRO", endsAt: endDate.toISOString() };
  }

  /** Begin an upgrade: a recurring Razorpay subscription, one-time link, or manual invoice. */
  async checkout(orgId: string, planIdInput: string): Promise<CheckoutResult> {
    const plan = planById(planIdInput);
    if (plan.id === "FREE") {
      throw new HttpException("The Free plan needs no checkout.", HttpStatus.BAD_REQUEST);
    }
    if (plan.custom) return manualCheckout(plan.name, 0); // Enterprise → contact/invoice
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
    await this.activate(orgId, plan.id, plan.priceInr, this.periodEnd("manual"));
    return { ok: true, plan: plan.id };
  }

  /** Verify + process a Razorpay webhook; activate / downgrade per the event. */
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
    const action = webhookAction(kind);
    if (action === "ignore") return { ok: true };

    const target = activationFromWebhook(event);
    if (!target) {
      this.log.warn(`Webhook ${kind} had no orgId/plan in notes — ignored`);
      return { ok: true };
    }
    const plan = planById(target.plan);

    if (action === "downgrade") {
      await this.cancel(target.orgId);
      this.log.log(`Downgraded org ${target.orgId} to FREE via ${kind}`);
      return { ok: true };
    }
    if (action === "mark_past_due") {
      await this.markPastDue(target.orgId, plan.name);
      this.log.log(`Org ${target.orgId} marked past_due (grace ${DUNNING_GRACE_DAYS}d) via ${kind}`);
      return { ok: true };
    }
    // activate_onetime → 30-day period; activate_recurring → open-ended (cancel webhook ends it).
    await this.activate(target.orgId, plan.id, plan.priceInr, this.periodEnd(action === "activate_recurring" ? "recurring" : "onetime"));
    this.log.log(`Activated ${plan.id} for org ${target.orgId} via ${kind}`);
    return { ok: true };
  }

  private periodEnd(kind: "recurring" | "onetime" | "manual"): Date | null {
    // Recurring stays active until cancelled; one-time/manual lapse after a month.
    return kind === "recurring" ? null : new Date(Date.now() + 30 * DAY_MS);
  }

  /** Supersede any in-force subscription and create the new active period. */
  private async activate(orgId: string, plan: PlanId, amountInr: number, endDate: Date | null): Promise<void> {
    const now = new Date();
    await this.prisma.withOrg(orgId, async (tx) => {
      await tx.subscription.updateMany({
        where: { status: { in: BillingService.IN_FORCE } },
        data: { status: "cancelled", endDate: now },
      });
      await tx.subscription.create({
        data: { orgId, plan, status: "active", startDate: now, endDate, billingCycle: "monthly", amountInr },
      });
    });
  }

  /** Cancel any in-force subscription → effective plan falls back to FREE. */
  private async cancel(orgId: string): Promise<void> {
    const now = new Date();
    await this.prisma.withOrg(orgId, (tx) =>
      tx.subscription.updateMany({
        where: { status: { in: BillingService.IN_FORCE } },
        data: { status: "cancelled", endDate: now },
      }),
    );
  }

  /**
   * A recurring charge failed → keep Pro for a grace window while Razorpay
   * retries. We mark the active row past_due with a grace deadline; once it
   * passes, effectivePlanOf() drops the org to Free with no cron. A later
   * successful charge supersedes this with a fresh active row.
   */
  private async markPastDue(orgId: string, planName: string): Promise<void> {
    const graceEnd = new Date(Date.now() + DUNNING_GRACE_DAYS * DAY_MS);
    const { count } = await this.prisma.withOrg(orgId, (tx) =>
      tx.subscription.updateMany({
        where: { status: "active" }, // only paid recurring subs enter dunning
        data: { status: "past_due", endDate: graceEnd },
      }),
    );
    if (count === 0) return; // nothing was active → nothing to dun
    // Email the account holder to update their card before the grace window ends.
    const account = await this.prisma.account.findFirst({ where: { orgId }, select: { email: true } });
    if (account?.email) await this.notifications.sendDunning(account.email, planName, DUNNING_GRACE_DAYS);
  }

  paymentMode() {
    return { provider: providerName(), live: isLive() };
  }
}
