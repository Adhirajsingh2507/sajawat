/**
 * Settings types (Milestone 1.8). A single business-settings document
 * (singleton, keyed `global`). `adminWhatsappNumber` is the lead-alert target.
 */
export interface ISettings {
  /** Fixed singleton key (`global`). */
  key: string;
  businessName?: string | undefined;
  supportEmail?: string | undefined;
  adminWhatsappNumber?: string | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
