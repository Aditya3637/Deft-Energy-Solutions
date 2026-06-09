/**
 * Notification delivery — shared types, provider selection, and PURE template
 * renderers (CI-tested). Same seam pattern as the OCR/BBPS/IEX/payments
 * adapters: a built-in "log" provider works with no account (logs the message,
 * reports delivered) so the whole flow is complete and testable today; a real
 * provider activates the moment its key is set. Sends never throw into the
 * caller — a failed email must not break sign-in or a billing webhook.
 *
 * Env:
 *   NOTIFY_EMAIL_PROVIDER = log (default) | resend
 *   RESEND_API_KEY, NOTIFY_EMAIL_FROM
 *   NOTIFY_SMS_PROVIDER   = log (default) | http   (generic gateway)
 *   NOTIFY_SMS_URL, NOTIFY_SMS_KEY
 */

export type Channel = "email" | "sms";

export type NotificationMessage = {
  channel: Channel;
  to: string;
  subject?: string; // email only
  text: string;
  html?: string; // email only
};

export type DeliveryResult = { delivered: boolean; channel: Channel; provider: string };

export function emailProvider(): "log" | "resend" {
  return process.env.NOTIFY_EMAIL_PROVIDER?.trim().toLowerCase() === "resend" ? "resend" : "log";
}

export function smsProvider(): "log" | "http" {
  return process.env.NOTIFY_SMS_PROVIDER?.trim().toLowerCase() === "http" ? "http" : "log";
}

export const APP_NAME = "Deft Energy";

/* ------------------------------------------------------------- templates */

export type Rendered = { subject: string; text: string; html: string };

function wrap(title: string, bodyHtml: string): string {
  return (
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">` +
    `<h2 style="margin:0 0 12px">${title}</h2>${bodyHtml}` +
    `<p style="margin-top:24px;font-size:12px;color:#64748b">${APP_NAME} — savings on your electricity bills.</p></div>`
  );
}

/** Magic-link sign-in email. */
export function renderMagicLink(opts: { link: string }): Rendered {
  const subject = `Your ${APP_NAME} sign-in link`;
  const text =
    `Sign in to ${APP_NAME}: ${opts.link}\n\n` +
    `This link expires in 15 minutes. If you didn't request it, you can ignore this email.`;
  const html = wrap(
    `Sign in to ${APP_NAME}`,
    `<p><a href="${opts.link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a></p>` +
      `<p style="font-size:13px;color:#64748b">Or paste this link: ${opts.link}<br>It expires in 15 minutes.</p>`,
  );
  return { subject, text, html };
}

/** Dunning email — a recurring charge failed; act before the grace window ends. */
export function renderDunning(opts: { planName: string; graceDays: number; manageUrl: string }): Rendered {
  const days = `${opts.graceDays} more day${opts.graceDays === 1 ? "" : "s"}`;
  const subject = `Action needed: update your ${APP_NAME} payment`;
  const text =
    `Your last ${APP_NAME} payment didn't go through. Your ${opts.planName} plan stays active for ${days} ` +
    `while we retry — update your payment method to avoid losing access: ${opts.manageUrl}`;
  const html = wrap(
    `Update your payment method`,
    `<p>Your last payment didn't go through. Your <strong>${opts.planName}</strong> plan stays active for ` +
      `<strong>${days}</strong> while we retry.</p>` +
      `<p><a href="${opts.manageUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Update payment</a></p>`,
  );
  return { subject, text, html };
}
