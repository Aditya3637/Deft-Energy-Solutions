import { type NotificationMessage } from "./notifications-core";

export function smsHttpConfigured(): boolean {
  return !!process.env.NOTIFY_SMS_URL?.trim();
}

/**
 * Generic SMS-gateway adapter (template, like the bill-fetch aggregator): POSTs
 * { to, text } to NOTIFY_SMS_URL with an optional Bearer key. Point it at your
 * provider (MSG91 / Twilio / Gupshup) and tweak the body to their contract.
 */
export async function sendViaHttp(msg: NotificationMessage): Promise<void> {
  const url = process.env.NOTIFY_SMS_URL?.trim();
  const key = process.env.NOTIFY_SMS_KEY?.trim();
  if (!url) throw new Error("SMS gateway not configured (NOTIFY_SMS_URL).");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ to: msg.to, text: msg.text }),
  });
  if (!res.ok) throw new Error(`SMS gateway error: ${res.status} ${res.statusText}`);
}
