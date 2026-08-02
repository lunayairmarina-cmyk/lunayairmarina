export type LocalizedString = { en: string; ar: string };

export interface SiteSettings {
  companyName: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: LocalizedString;
  socialLinks: {
    instagram: string;
    linkedin: string;
    facebook: string;
    youtube: string;
  };
}

export interface HomepageContent {
  heroTitle: LocalizedString;
  heroDescription: LocalizedString;
  heroEyebrow: LocalizedString;
  heroVideo: string;
  heroImage: string;
  primaryCTA: LocalizedString;
  secondaryCTA: LocalizedString;
  scrollLabel: LocalizedString;
}

export interface AboutContent {
  title: LocalizedString;
  description: LocalizedString;
  lead: LocalizedString;
  body: LocalizedString;
  eyebrow: LocalizedString;
  mission: LocalizedString;
  vision: LocalizedString;
  values: Array<{ title: LocalizedString; description: LocalizedString }>;
  image: string;
  points: LocalizedString[];
  stats: Array<{ value: number; suffix: string; label: LocalizedString }>;
}

export interface ServiceContent {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  features: LocalizedString[];
  order: number;
  gallery?: Array<{ src: string; caption: LocalizedString }>;
  details?: Record<string, unknown>;
}

export interface FleetItem {
  id: string;
  yachtName: string;
  yachtType: LocalizedString;
  yachtLength: string;
  image: string;
  description: LocalizedString;
  capacity?: number;
  crew?: number;
  order?: number;
}

export interface TeamMember {
  id: string;
  name: LocalizedString;
  position: LocalizedString;
  image: string;
  bio: LocalizedString;
  order?: number;
}

export interface TestimonialContent {
  id: string;
  clientName: string;
  role: LocalizedString;
  text: LocalizedString;
  image?: string;
  order?: number;
}

export interface LocationContent {
  id: string;
  city: LocalizedString;
  description: LocalizedString;
}

export interface BlogContent {
  id: string;
  slug: string;
  title: LocalizedString;
  content: string | LocalizedString;
  excerpt?: LocalizedString;
  image: string;
  date: string;
  status?: "published" | "draft";
  author?: LocalizedString;
  blocks?: unknown[];
  seoTitle?: LocalizedString;
  seoDescription?: LocalizedString;
  [key: string]: unknown;
}

export interface GalleryContent {
  id: string;
  src: string;
  caption: LocalizedString;
  span: "tall" | "wide" | "normal";
  order?: number;
}

export interface FaqContent {
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
  order?: number;
}

export interface WhyContent {
  eyebrow: LocalizedString;
  title: LocalizedString;
  items: Array<{ title: LocalizedString; description: LocalizedString }>;
}

export interface TrustContent {
  eyebrow: LocalizedString;
  title: LocalizedString;
  lead: LocalizedString;
  cta: LocalizedString;
  slots: Array<{ title: LocalizedString; body: LocalizedString }>;
}

export interface SiteBundle {
  settings: SiteSettings | null;
  homepage: HomepageContent | null;
  about: AboutContent | null;
  why: WhyContent | null;
  trust: TrustContent | null;
  services: ServiceContent[];
  fleet: FleetItem[];
  team: TeamMember[];
  testimonials: TestimonialContent[];
  locations: LocationContent[];
  blog: BlogContent[];
  gallery: GalleryContent[];
  faq: FaqContent[];
  copy: { en: Record<string, unknown>; ar: Record<string, unknown> } | null;
  fetchedAt: number;
}
