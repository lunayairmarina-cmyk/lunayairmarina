/**
 * Public content API for the marketing site.
 * Components / providers should import from `@/services/content` only.
 *
 * Flow: Service → Repository (Firestore + session cache) → CMS local overlay → empty fallbacks
 */
export { getSiteContent, clearContentCache } from "./content.repository";
export type { SiteBundle } from "./content.types";
