/**
 * Notification provider abstraction (Milestone 1.8). A provider-agnostic seam so
 * the app can send transactional messages (WhatsApp now, MSG91 SMS later) without
 * the domain layer knowing the channel. Mirrors the PaymentProvider pattern:
 * config-gated, so an unconfigured provider reports `isConfigured() === false`
 * and callers degrade gracefully (the business action still succeeds).
 */
export interface NotificationResult {
  /** True when the provider accepted the message for delivery. */
  delivered: boolean;
  /** Set when the send was skipped (e.g. provider not configured). */
  skipped?: boolean;
  /** Human-readable reason for a skip/failure (never contains secrets). */
  reason?: string;
}

export interface NotificationProvider {
  /** Channel id for logging (e.g. `whatsapp`). */
  readonly channel: string;
  /** True only when the provider has the credentials it needs to send. */
  isConfigured(): boolean;
  /** Send a plain-text message to an E.164 recipient. Never throws. */
  sendText(to: string, message: string): Promise<NotificationResult>;
}
