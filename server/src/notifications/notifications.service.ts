import { Injectable, Logger } from "@nestjs/common";

import {
  APP_NAME,
  emailProvider,
  renderDunning,
  renderMagicLink,
  smsProvider,
  type DeliveryResult,
  type NotificationMessage,
} from "./notifications-core";
import { sendViaResend } from "./provider-email";
import { sendViaHttp } from "./provider-sms";

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  /**
   * Dispatch a message on its channel via the configured provider. Built-in
   * "log" provider always "delivers" (logged) so flows work with no account.
   * Never throws — a delivery failure is logged and reported, not propagated.
   */
  async send(msg: NotificationMessage): Promise<DeliveryResult> {
    const provider = msg.channel === "email" ? emailProvider() : smsProvider();
    try {
      if (provider === "log") {
        this.log.log(`[notify:log] ${msg.channel} → ${msg.to} :: ${msg.subject ?? msg.text.slice(0, 60)}`);
        return { delivered: true, channel: msg.channel, provider: "log" };
      }
      if (msg.channel === "email" && provider === "resend") await sendViaResend(msg);
      else if (msg.channel === "sms" && provider === "http") await sendViaHttp(msg);
      return { delivered: true, channel: msg.channel, provider };
    } catch (err) {
      this.log.warn(`Notification (${msg.channel}/${provider}) to ${msg.to} failed: ${(err as Error).message}`);
      return { delivered: false, channel: msg.channel, provider };
    }
  }

  /** Magic-link sign-in email. */
  async sendMagicLink(email: string, link: string): Promise<DeliveryResult> {
    const r = renderMagicLink({ link });
    return this.send({ channel: "email", to: email, subject: r.subject, text: r.text, html: r.html });
  }

  /** Dunning email — failed recurring charge, within the grace window. */
  async sendDunning(email: string, planName: string, graceDays: number): Promise<DeliveryResult> {
    const manageUrl = `${(process.env.APP_URL ?? "").replace(/\/$/, "")}/app/settings`;
    const r = renderDunning({ planName, graceDays, manageUrl });
    return this.send({ channel: "email", to: email, subject: r.subject, text: r.text, html: r.html });
  }

  appName() {
    return APP_NAME;
  }
}
