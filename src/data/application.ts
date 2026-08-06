export const appOverviewCards = [
  { id: "tanks", icon: "Ship", key: "tanks" },
  { id: "checklist", icon: "CalendarDays", key: "checklist" },
  { id: "safety", icon: "Anchor", key: "safety" },
  { id: "systems", icon: "Compass", key: "systems" },
  { id: "documents", icon: "FileText", key: "documents" },
  { id: "crew", icon: "Users", key: "crew" },
  { id: "services", icon: "LifeBuoy", key: "services" },
  { id: "history", icon: "Crown", key: "history" },
  { id: "info", icon: "UserRound", key: "info" },
] as const;

/** Real app screenshots from /public/images/app — filenames describe the screen */
export const APP_SCREEN_BASE = "/images/app";

/** Bust browser cache when swapping screenshot files during local preview */
const APP_SCREEN_VERSION = "20260805b";

const appImg = (name: string) => `${APP_SCREEN_BASE}/${name}.jpg?v=${APP_SCREEN_VERSION}`;

export const appScreens = {
  homeapp: appImg("homeapp"),
  schedule: appImg("schedule"),
  certifications: appImg("certifications"),
  supportCenter: appImg("support-center"),
  manageFleet: appImg("manage-fleet"),
  findDock: appImg("find-dock"),
  myBookings: appImg("my-bookings"),
  profileOwner: appImg("profile-owner"),
  profileVip: appImg("profile-vip"),
  profileCaptain: appImg("profile-captain"),
  createTour: appImg("create-tour"),
  tourDetails: appImg("tour-details"),
} as const;

/** Feature carousel: screenshot + i18n key (one unique screen each) */
export const featureSlides = [
  { key: "monitoring", src: appScreens.homeapp },
  { key: "fleet", src: appScreens.manageFleet },
  { key: "maintenance", src: appScreens.schedule },
  { key: "expenses", src: appScreens.myBookings },
  { key: "notifications", src: appScreens.supportCenter },
  { key: "safety", src: appScreens.findDock },
  { key: "documents", src: appScreens.certifications },
  { key: "photos", src: appScreens.tourDetails },
  { key: "scheduling", src: appScreens.createTour },
  { key: "crew", src: appScreens.profileCaptain },
  { key: "tanks", src: appScreens.profileOwner },
  { key: "history", src: appScreens.profileVip },
] as const;

/** Featured shots used in section phone frames */
export const appFeaturedScreens = {
  hero: appScreens.homeapp,
  overview: appScreens.homeapp,
  fleet: appScreens.manageFleet,
  schedule: appScreens.schedule,
  bookings: appScreens.myBookings,
} as const;

/** Gallery — all named product screens */
export const galleryScreens = [
  { src: appScreens.homeapp, labelKey: "home" },
  { src: appScreens.manageFleet, labelKey: "fleet" },
  { src: appScreens.schedule, labelKey: "schedule" },
  { src: appScreens.findDock, labelKey: "dock" },
  { src: appScreens.certifications, labelKey: "certs" },
  { src: appScreens.tourDetails, labelKey: "tours" },
  { src: appScreens.profileOwner, labelKey: "owner" },
  { src: appScreens.profileVip, labelKey: "vip" },
  { src: appScreens.profileCaptain, labelKey: "crew" },
  { src: appScreens.createTour, labelKey: "create" },
] as const;
