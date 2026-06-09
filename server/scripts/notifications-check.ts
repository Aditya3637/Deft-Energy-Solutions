/**
 * Notification-layer invariants (CI — `ts-node --transpile-only`).
 *
 * Covers env-based provider selection (defaults to the no-account "log"
 * provider) and the PURE template renderers — magic-link & dunning — which are
 * what actually reach a customer. No network. Exits non-zero on any failure.
 */

import {
  emailProvider,
  renderDunning,
  renderMagicLink,
  smsProvider,
} from "../src/notifications/notifications-core";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

console.log("Notification layer invariants:");

// ── Provider selection ───────────────────────────────────────────────────────
{
  delete process.env.NOTIFY_EMAIL_PROVIDER;
  check(emailProvider() === "log", "email defaults to log (works with no account)");
  process.env.NOTIFY_EMAIL_PROVIDER = "resend";
  check(emailProvider() === "resend", "NOTIFY_EMAIL_PROVIDER=resend selects Resend");
  delete process.env.NOTIFY_EMAIL_PROVIDER;

  delete process.env.NOTIFY_SMS_PROVIDER;
  check(smsProvider() === "log", "sms defaults to log");
  process.env.NOTIFY_SMS_PROVIDER = "http";
  check(smsProvider() === "http", "NOTIFY_SMS_PROVIDER=http selects the gateway");
  delete process.env.NOTIFY_SMS_PROVIDER;
}

// ── Magic-link template ──────────────────────────────────────────────────────
{
  const link = "https://app.deftenergy.example/login?token=abc.def.ghi";
  const r = renderMagicLink({ link });
  check(/sign-in/i.test(r.subject), "magic-link subject mentions sign-in");
  check(r.text.includes(link) && r.html.includes(link), "magic-link carries the link in text + html");
  check(/15 minutes/.test(r.text), "magic-link states the 15-minute expiry");
}

// ── Dunning template ─────────────────────────────────────────────────────────
{
  const r = renderDunning({ planName: "Pro", graceDays: 7, manageUrl: "https://app.x/app/settings" });
  check(/payment/i.test(r.subject), "dunning subject is about payment");
  check(r.text.includes("Pro") && r.text.includes("7 more days"), "dunning text names plan + grace days");
  check(r.text.includes("https://app.x/app/settings"), "dunning text carries the manage-payment link");
  const one = renderDunning({ planName: "Pro", graceDays: 1, manageUrl: "u" });
  check(one.text.includes("1 more day") && !one.text.includes("1 more days"), "dunning pluralises 1 day correctly");
}

if (failures > 0) {
  console.error(`\n${failures} notification invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll notification layer invariants hold.");
