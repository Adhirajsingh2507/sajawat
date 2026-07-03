/**
 * Notification service (Milestone 1.8) — app-level orchestration over the
 * provider abstraction. `sendLeadAlert` resolves the recipient from business
 * settings and dispatches via WhatsApp. Best-effort: it never throws, so a
 * notification failure can never roll back a persisted lead.
 */
import { logger } from '../config/logger.js';
import { settingsService } from '../modules/settings/settings.service.js';
import { whatsappProvider } from './whatsapp-provider.js';
import type { NotificationResult } from './notification-provider.js';

export interface LeadAlert {
  name: string;
  company: string;
  phone: string;
  city: string;
  quantity?: number | null | undefined;
  productInterest?: string | undefined;
}

function formatLeadMessage(lead: LeadAlert): string {
  const lines = [
    '🛎️ New B2B wholesale enquiry',
    `Name: ${lead.name}`,
    `Company: ${lead.company}`,
    `Phone: ${lead.phone}`,
    `City: ${lead.city}`,
  ];
  if (lead.quantity != null) lines.push(`Quantity: ${String(lead.quantity)}`);
  if (lead.productInterest !== undefined && lead.productInterest.length > 0) {
    lines.push(`Interest: ${lead.productInterest}`);
  }
  return lines.join('\n');
}

/**
 * Fire the instant admin WhatsApp alert for a new lead. Skips (and logs) when no
 * admin number is set or the provider is unconfigured — the lead is already saved.
 */
async function sendLeadAlert(lead: LeadAlert): Promise<NotificationResult> {
  const adminNumber = await settingsService.getAdminWhatsappNumber();
  if (adminNumber === null) {
    logger.info({ reason: 'no_admin_number' }, 'lead alert skipped');
    return { delivered: false, skipped: true, reason: 'no_admin_number' };
  }
  const result = await whatsappProvider.sendText(adminNumber, formatLeadMessage(lead));
  if (result.delivered) {
    logger.info({ channel: 'whatsapp' }, 'lead alert sent');
  } else {
    logger.info({ channel: 'whatsapp', reason: result.reason }, 'lead alert not delivered');
  }
  return result;
}

export const notificationService = {
  sendLeadAlert,
};
