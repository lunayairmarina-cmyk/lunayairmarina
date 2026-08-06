import heroYacht from "@/assets/hero/hero-main.webp";
import aboutMarina from "@/assets/about/yacht_side_transom_landscape.png";
import yacht1 from "@/assets/fleet/fleet-01.jpg";
import yacht2 from "@/assets/fleet/fleet-02.jpg";
import yacht3 from "@/assets/fleet/fleet-03.jpg";
import gallery1 from "@/assets/gallery/gallery-01-marina.jpg";
import gallery2 from "@/assets/gallery/gallery-02-deck.jpg";
import gallery3 from "@/assets/gallery/gallery-03-lounge.jpg";
import gallery4 from "@/assets/gallery/gallery-04-sunset.jpg";
import gallery5 from "@/assets/gallery/gallery-05-arrival.jpg";
import gallery6 from "@/assets/gallery/gallery-06-crew.jpg";
import gallery7 from "@/assets/gallery/gallery-07-harbor.jpg";
import gallery8 from "@/assets/gallery/gallery-08-bridge.jpg";
import serviceYachtMgmt from "@/assets/services/service-yacht-management.jpg";
import serviceAgency from "@/assets/services/service-yacht-agency.jpg";
import serviceMarina from "@/assets/services/service-marina.jpg";
import serviceCrew from "@/assets/services/service-crew.jpg";

export const images = {
  heroYacht,
  aboutMarina,
  yacht1,
  yacht2,
  yacht3,
  gallery1,
  gallery2,
  gallery3,
  gallery4,
};

export interface Yacht {
  id: string;
  name: string;
  image: string;
  length: string;
  category: { en: string; ar: string };
  capacity: number;
  crew: number;
}

export interface GalleryImage {
  id: string;
  src: string;
  caption: { en: string; ar: string };
  span: "tall" | "wide" | "normal";
  /** Keep LM brand visible under object-cover crops */
  objectPosition?: string;
}

export interface ServiceRecord {
  id: string;
  image: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  status: "active" | "draft";
}

export interface TestimonialRecord {
  id: string;
  name: string;
  position: string;
  review: string;
  initials: string;
}

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
}

export interface MessageRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  status: "new" | "read";
}

export const yachts: Yacht[] = [
  {
    id: "y1",
    name: "Lunayair Dawn",
    image: yacht1,
    length: "38 m",
    category: { en: "Motor Yacht", ar: "يخت آلي" },
    capacity: 12,
    crew: 7,
  },
  {
    id: "y2",
    name: "Coral Explorer",
    image: yacht2,
    length: "45 m",
    category: { en: "Explorer", ar: "يخت استكشاف" },
    capacity: 14,
    crew: 9,
  },
  {
    id: "y3",
    name: "Meridian",
    image: yacht3,
    length: "52 m",
    category: { en: "Ocean Yacht", ar: "يخت محيطي" },
    capacity: 10,
    crew: 8,
  },
];

export const galleryImages: GalleryImage[] = [
  {
    id: "g1",
    src: gallery1,
    caption: {
      en: "Illuminated stern at night",
      ar: "مؤخرة اليخت المضيئة ليلًا",
    },
    span: "tall",
    objectPosition: "50% 42%",
  },
  {
    id: "g2",
    src: gallery3,
    caption: {
      en: "Transom branding at golden hour",
      ar: "شعار الترانزم عند الغروب",
    },
    span: "normal",
    objectPosition: "50% 48%",
  },
  {
    id: "g3",
    src: gallery2,
    caption: {
      en: "Brand mark on the hull",
      ar: "شعار المارينا على الهيكل",
    },
    span: "normal",
    objectPosition: "50% 45%",
  },
  {
    id: "g4",
    src: gallery8,
    caption: {
      en: "Owner briefing on the bridge",
      ar: "اجتماع المالك في غرفة القيادة",
    },
    span: "normal",
    objectPosition: "48% 40%",
  },
  {
    id: "g5",
    src: heroYacht,
    caption: {
      en: "Bow cutting open water",
      ar: "مقدمة اليخت في المياه المفتوحة",
    },
    span: "normal",
    objectPosition: "45% 50%",
  },
  {
    id: "g6",
    src: gallery5,
    caption: {
      en: "Visiting yacht at the pier",
      ar: "يخت زائر عند الرصيف",
    },
    span: "normal",
    objectPosition: "50% 45%",
  },
  {
    id: "g7",
    src: gallery6,
    caption: {
      en: "Crew on deck briefing",
      ar: "إحاطة الطاقم على السطح",
    },
    span: "normal",
    objectPosition: "50% 40%",
  },
  {
    id: "g8",
    src: gallery4,
    caption: {
      en: "Fleet convoy from the air",
      ar: "قافلة اليخوت من الجو",
    },
    span: "normal",
    objectPosition: "55% 55%",
  },
  {
    id: "g9",
    src: gallery7,
    caption: {
      en: "Harbor panorama",
      ar: "بانوراما الميناء",
    },
    span: "normal",
    objectPosition: "60% 45%",
  },
];

export const serviceRecords: ServiceRecord[] = [
  {
    id: "s1",
    image: serviceYachtMgmt,
    title: { en: "360° Yacht Management", ar: "إدارة يخوت ٣٦٠ درجة" },
    description: {
      en: "Complete operational, technical and financial yacht management.",
      ar: "إدارة تشغيلية وفنية ومالية متكاملة لليخوت.",
    },
    status: "active",
  },
  {
    id: "s2",
    image: serviceAgency,
    title: { en: "Visiting Yacht Agency", ar: "وكالة اليخوت الزائرة" },
    description: {
      en: "Permits, clearance and logistics for international yachts.",
      ar: "تصاريح وتخليص وخدمات لوجستية لليخوت الدولية.",
    },
    status: "active",
  },
  {
    id: "s3",
    image: serviceMarina,
    title: { en: "Marina Management", ar: "إدارة المارينا" },
    description: {
      en: "Professional marina operations and berthing solutions.",
      ar: "تشغيل احترافي للمارينا وحلول الرسو.",
    },
    status: "active",
  },
  {
    id: "s4",
    image: serviceCrew,
    title: { en: "Crew Management", ar: "إدارة الطواقم" },
    description: {
      en: "Recruitment and management of marine professionals.",
      ar: "توظيف وإدارة الكوادر البحرية.",
    },
    status: "draft",
  },
];

export const testimonialRecords: TestimonialRecord[] = [
  {
    id: "t1",
    name: "Khalid Al-Rasheed",
    position: "Yacht Owner",
    review: "Transparent reporting and flawless refit delivery.",
    initials: "KR",
  },
  {
    id: "t2",
    name: "Sophie Laurent",
    position: "Family Office Director",
    review: "Managing three vessels became effortless.",
    initials: "SL",
  },
  {
    id: "t3",
    name: "Marco Bianchi",
    position: "Master, S/Y Meridian",
    review: "They answer at 3am and solve it before sunrise.",
    initials: "MB",
  },
];

export const faqRecords: FaqRecord[] = [
  {
    id: "f1",
    question: "What yacht management services do you provide?",
    answer: "Full 360° technical, operational and financial management.",
  },
  {
    id: "f2",
    question: "Do you manage international yachts?",
    answer: "Yes, through our visiting yacht agency division.",
  },
  {
    id: "f3",
    question: "Do you provide crew recruitment?",
    answer: "We recruit, vet and manage certified marine professionals.",
  },
  {
    id: "f4",
    question: "How can I request consultation?",
    answer: "Use the contact form or call our 24/7 operations desk.",
  },
];

export const messageRecords: MessageRecord[] = [
  {
    id: "m1",
    name: "Faisal Al-Otaibi",
    email: "faisal@example.com",
    phone: "+966 55 100 2200",
    message: "Looking for full management of a 40m motor yacht based in Jeddah.",
    date: "2026-07-28",
    status: "new",
  },
  {
    id: "m2",
    name: "Elena Rossi",
    email: "elena@example.com",
    phone: "+39 340 118 9922",
    message: "Requesting agency support for arrival to Saudi waters in October.",
    date: "2026-07-26",
    status: "new",
  },
  {
    id: "m3",
    name: "James Whitfield",
    email: "james@example.com",
    phone: "+44 7700 900123",
    message: "Interested in crew placement for a seasonal charter programme.",
    date: "2026-07-22",
    status: "read",
  },
  {
    id: "m4",
    name: "Noura Al-Harbi",
    email: "noura@example.com",
    phone: "+966 50 774 1180",
    message: "Please share your marina management proposal template.",
    date: "2026-07-19",
    status: "read",
  },
];

export const companyInfo = {
  phone: "966531561212",
  phoneDisplay: "+966 53 156 1212",
  whatsapp: "966531561212",
  email: "info@lunayairmarina.com",
  addressEn: "Al Murjan Tower, Prince Sultan Road, Al Rawdah, Jeddah",
  addressAr: "برج المرجان، طريق الأمير سلطان، حي الروضة، جدة",
  social: {
    instagram: "https://www.instagram.com/lunayairmarina",
    linkedin: "https://www.linkedin.com/company/lunayairmarina",
    facebook: "",
    youtube: "",
    tiktok: "https://vt.tiktok.com/ZSHVceVcD/",
    x: "https://x.com/lunayairmarina",
  },
};
