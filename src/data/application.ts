export const appOverviewCards = [
  { id: "tanks", icon: "Droplets", key: "tanks" },
  { id: "checklist", icon: "ListChecks", key: "checklist" },
  { id: "safety", icon: "ShieldCheck", key: "safety" },
  { id: "systems", icon: "Cpu", key: "systems" },
  { id: "documents", icon: "FileText", key: "documents" },
  { id: "crew", icon: "Users", key: "crew" },
  { id: "services", icon: "Wrench", key: "services" },
  { id: "history", icon: "History", key: "history" },
  { id: "info", icon: "Info", key: "info" },
] as const;

export const tankLevels = [
  { id: "diesel", key: "diesel", value: 75, color: "#C8A96A" },
  { id: "fresh", key: "fresh", value: 92, color: "#5B9FD4" },
  { id: "waste", key: "waste", value: 40, color: "#E07A5F" },
  { id: "gas", key: "gas", value: 80, color: "#7EBF8A" },
] as const;

export const checklistGroups = [
  {
    id: "exterior",
    key: "exterior",
    items: ["fullWash", "windshield", "deck", "cupHolder"],
  },
  {
    id: "interior",
    key: "interior",
    items: ["sink", "floor", "fingerprint"],
  },
  {
    id: "below",
    key: "below",
    items: ["generator", "engine", "battery"],
  },
] as const;

export const upcomingServices = [
  { id: "s1", key: "bottomPaint", dateKey: "sep19", status: "upcoming" },
  { id: "s2", key: "engine", dateKey: "aug14", status: "completed" },
  { id: "s3", key: "generator", dateKey: "sep15", status: "upcoming" },
  { id: "s4", key: "seakeeper", dateKey: "aug10", status: "overdue" },
  { id: "s5", key: "ac", dateKey: "noDate", status: "upcoming" },
] as const;

export const appFeatureCards = [
  "monitoring",
  "notifications",
  "maintenance",
  "crew",
  "documents",
  "safety",
  "tanks",
  "expenses",
  "photos",
  "scheduling",
  "fleet",
  "history",
] as const;

export const galleryScreens = [
  "dashboard",
  "tanks",
  "checklist",
  "crew",
  "services",
  "notifications",
  "history",
] as const;
