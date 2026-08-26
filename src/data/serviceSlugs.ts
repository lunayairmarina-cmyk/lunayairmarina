export const SERVICE_SLUGS = [
  "yacht-management-360",
  "visiting-yacht-agency",
  "marina-management",
  "crew-management",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];
