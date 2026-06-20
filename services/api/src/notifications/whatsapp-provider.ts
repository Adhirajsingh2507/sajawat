/**
 * WhatsApp provider (Milestone 1.8) — Official WhatsApp Business (Meta Cloud)
 * API over fetch, no SDK. Config-gated: unconfigured → `isConfigured() === false`
 * and `sendText` returns a skipped result rather than throwing, so a missing key
 * never breaks lead capture. Goes live once WHATSAPP_PHONE_NUMBER_ID +
 * WHATSAPP_ACCESS_TOKEN are set.
 */
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { NotificationProvider, NotificationResult } from './notification-provider.js';

export class WhatsAppProvider implements NotificationProvider {
  readonly channel = 'whatsapp';

  isConfigured(): boolean {
    return env.WHATSAPP_PHONE_NUMBER_ID !== undefined && env.WHATSAPP_ACCESS_TOKEN !== undefined;
  }

  async sendText(to: string, message: string): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return { delivered: false, skipped: true, reason: 'whatsapp_not_configured' };
    }
    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${String(
      env.WHATSAPP_PHONE_NUMBER_ID,
    )}/messages`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${String(env.WHATSAPP_ACCESS_TOKEN)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      });
      if (!res.ok) {
        // Log the status only — never the token or full provider error body.
        logger.warn({ channel: this.channel, status: res.status }, 'WhatsApp send failed');
        return { delivered: false, reason: `provider_status_${String(res.status)}` };
      }
      return { delivered: true };
    } catch (err) {
      logger.warn({ channel: this.channel, err }, 'WhatsApp send threw');
      return { delivered: false, reason: 'provider_error' };
    }
  }
}

export const whatsappProvider = new WhatsAppProvider();
