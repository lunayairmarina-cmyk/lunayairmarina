import type { ExtractedEntitySet } from "./extractEntities";
import type { CommercialLevel } from "./commercialScore";

export interface LeadQualification {
  service?: string;
  location?: string;
  yacht: boolean;
  yachtLength?: number;
  interest: CommercialLevel;
  pricingInterest: boolean;
  contactIntent: boolean;
  commercialIntent: CommercialLevel;
}

export function qualifyLead(
  intentId: string,
  entities: ExtractedEntitySet,
  commercialLevel: CommercialLevel,
): LeadQualification {
  let service: string | undefined;
  if (intentId.startsWith("YACHT")) service = intentId.includes("360") ? "YACHT_MANAGEMENT_360" : "YACHT_MANAGEMENT";
  else if (intentId.startsWith("CREW")) service = "CREW_MANAGEMENT";
  else if (intentId.startsWith("MARINA")) service = "MARINA_MANAGEMENT";
  else if (intentId.startsWith("VISITING")) service = "VISITING_YACHT_AGENCY";
  else service = intentId;

  return {
    service,
    location: entities.locationCanonical[0],
    yacht: entities.yacht,
    yachtLength: entities.yachtLength?.value,
    interest: commercialLevel,
    pricingInterest: entities.pricingInterest,
    contactIntent: entities.contactIntent,
    commercialIntent: commercialLevel,
  };
}
