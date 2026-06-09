import { type NotificationMessage } from "./notifications-core";

export function resendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim();
}

/**
 * Send an email via Resend (single HTTP call, no SDK). Throws on failure so the
 * service can log + report delivered:false; never bubbles to the caller.
 */
export async function sendViaResend(msg: NotificationMessage): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NOTIFY_EMAIL_FROM?.trim() || "Deft Energy <onboarding@resend.dev>";
  if (!key) throw new Error("Resend not configured (RESEND_API_KEY).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject ?? "",
      ...(msg.html ? { html: msg.html } : {}),
      text: msg.text,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(`Resend error: ${body?.message ?? `${res.status} ${res.statusText}`}`);
  }
}
