import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";
import { signMagic, signSession, verifyMagic } from "./jwt";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Step 1 — request a magic link. With no email provider wired we return the
   * link in the response and log it (pluggable later). `sent: true` either way
   * so the UI never reveals whether an email exists.
   */
  requestMagicLink(emailRaw: string) {
    const email = (emailRaw ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException("Enter a valid email");
    const token = signMagic(email);
    const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
    const link = appUrl ? `${appUrl}/login?token=${token}` : `/login?token=${token}`;
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== "production") console.log(`[auth] magic link for ${email}: ${link}`);
    const devReveal = process.env.NODE_ENV !== "production" || process.env.AUTH_REVEAL_LINK?.trim();
    return { sent: true, ...(devReveal ? { token, link } : {}) };
  }

  /** Step 2 — verify the magic token, resolve/create the org, issue a session. */
  async verify(token: string) {
    const email = verifyMagic((token ?? "").trim());
    if (!email) throw new UnauthorizedException("Invalid or expired link");
    const account = await this.resolveAccount(email);
    return {
      token: signSession({ orgId: account.orgId, userId: account.userId, email }),
      email,
      orgId: account.orgId,
    };
  }

  /** Current session context → who am I + my org. */
  async me(orgId: string, email: string) {
    const org = await this.prisma.withOrg(orgId, (tx) =>
      tx.organisation.findUnique({ where: { id: orgId }, select: { id: true, name: true, plan: true } }),
    );
    return { email, orgId, org };
  }

  /** Email → account (org). New email mints a fresh org + owner user. */
  private async resolveAccount(email: string): Promise<{ orgId: string; userId: string }> {
    const existing = await this.prisma.account.findUnique({ where: { email } });
    if (existing) return { orgId: existing.orgId, userId: existing.userId };

    const orgId = randomUUID();
    const userId = randomUUID();
    const domain = email.split("@")[1] ?? "My Organisation";
    await this.prisma.withOrg(orgId, async (tx) => {
      await tx.organisation.create({ data: { id: orgId, name: domain, plan: "FREE" } });
      await tx.user.create({ data: { id: userId, orgId, email, name: email.split("@")[0], role: "OWNER" } });
    });
    // Verifying the magic link from the privacy notice is the explicit consent act.
    await this.prisma.account.create({
      data: { email, orgId, userId, consentAt: new Date(), consentVersion: "2023-DPDP-v1" },
    });
    return { orgId, userId };
  }
}
