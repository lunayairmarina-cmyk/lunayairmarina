import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { companyInfo } from "@/data/mock";
import type { SiteSettings } from "@/types/content";

const fallbackSettings: SiteSettings = {
  companyName: "lunayairmarina",
  phone: companyInfo.phone,
  phoneDisplay: companyInfo.phoneDisplay,
  whatsapp: companyInfo.whatsapp,
  email: companyInfo.email,
  address: {
    en: companyInfo.addressEn,
    ar: companyInfo.addressAr,
  },
  socialLinks: { ...companyInfo.social },
};

/** Settings from Firebase with local fallback until seed/CMS is ready. */
export function useCompanySettings(): SiteSettings {
  const site = useOptionalSiteContent();
  const remote = site?.bundle?.settings;
  if (!remote) return fallbackSettings;
  return {
    ...fallbackSettings,
    ...remote,
    socialLinks: {
      ...fallbackSettings.socialLinks,
      ...remote.socialLinks,
    },
    address: {
      ...fallbackSettings.address,
      ...remote.address,
    },
  };
}

export function useCompanyAddress(): string {
  const settings = useCompanySettings();
  const { language } = useLanguage();
  return settings.address[language] || settings.address.en;
}
