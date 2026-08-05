import heroYacht from "@/assets/hero/hero-main.webp";
import aboutMarina from "@/assets/about/about-marina.jpg";
import yacht1 from "@/assets/fleet/fleet-01.jpg";
import yacht2 from "@/assets/fleet/fleet-02.jpg";
import yacht3 from "@/assets/fleet/fleet-03.jpg";
import gallery1 from "@/assets/gallery/gallery-01-marina.jpg";
import gallery2 from "@/assets/gallery/gallery-02-deck.jpg";
import gallery3 from "@/assets/gallery/gallery-03-lounge.jpg";
import gallery4 from "@/assets/gallery/gallery-04-sunset.jpg";

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
    category: { en: "Sailing Yacht", ar: "يخت شراعي" },
    capacity: 10,
    crew: 8,
  },
  {
    id: "y4",
    name: "Northern Pearl",
    image: heroYacht,
    length: "64 m",
    category: { en: "Superyacht", ar: "يخت فائق" },
    capacity: 16,
    crew: 14,
  },
  {
    id: "y5",
    name: "Serenity Bay",
    image: aboutMarina,
    length: "34 m",
    category: { en: "Motor Yacht", ar: "يخت آلي" },
    capacity: 10,
    crew: 6,
  },
  {
    id: "y6",
    name: "Red Sea Lady",
    image: gallery1,
    length: "29 m",
    category: { en: "Cruiser", ar: "يخت سياحي" },
    capacity: 8,
    crew: 5,
  },
];

export const galleryImages: GalleryImage[] = [
  {
    id: "g1",
    src: gallery1,
    caption: { en: "Sundeck jacuzzi", ar: "جاكوزي السطح العلوي" },
    span: "tall",
  },
  {
    id: "g2",
    src: gallery2,
    caption: { en: "Marina operations", ar: "عمليات المارينا" },
    span: "normal",
  },
  {
    id: "g3",
    src: gallery3,
    caption: { en: "Professional crew", ar: "طاقم محترف" },
    span: "normal",
  },
  {
    id: "g4",
    src: gallery4,
    caption: { en: "Main salon", ar: "الصالون الرئيسي" },
    span: "normal",
  },
  {
    id: "g5",
    src: heroYacht,
    caption: { en: "Open water cruising", ar: "الإبحار في المياه المفتوحة" },
    span: "normal",
  },
  { id: "g6", src: yacht2, caption: { en: "Private anchorage", ar: "مرسى خاص" }, span: "normal" },
  { id: "g7", src: aboutMarina, caption: { en: "Berthing at dusk", ar: "الرسو عند الغروب" }, span: "normal" },
  { id: "g8", src: yacht3, caption: { en: "Sailing at golden hour", ar: "إبحار عند الغروب" }, span: "normal" },
];

export const serviceRecords: ServiceRecord[] = [
  {
    id: "s1",
    image: heroYacht,
    title: { en: "360° Yacht Management", ar: "إدارة يخوت ٣٦٠ درجة" },
    description: {
      en: "Complete operational, technical and financial yacht management.",
      ar: "إدارة تشغيلية وفنية ومالية متكاملة لليخوت.",
    },
    status: "active",
  },
  {
    id: "s2",
    image: gallery2,
    title: { en: "Visiting Yacht Agency", ar: "وكالة اليخوت الزائرة" },
    description: {
      en: "Permits, clearance and logistics for international yachts.",
      ar: "تصاريح وتخليص وخدمات لوجستية لليخوت الدولية.",
    },
    status: "active",
  },
  {
    id: "s3",
    image: aboutMarina,
    title: { en: "Marina Management", ar: "إدارة المارينا" },
    description: {
      en: "Professional marina operations and berthing solutions.",
      ar: "تشغيل احترافي للمارينا وحلول الرسو.",
    },
    status: "active",
  },
  {
    id: "s4",
    image: gallery3,
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
