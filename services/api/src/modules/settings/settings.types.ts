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
  /** Public storefront display fields (Contact page). */
  instagramUrl?: string | undefined;
  facebookUrl?: string | undefined;
  youtubeUrl?: string | undefined;
  addressText?: string | undefined;
  businessHours?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
