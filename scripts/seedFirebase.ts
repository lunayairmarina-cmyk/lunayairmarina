/**
 * Seeds Firestore (+ Storage when available) with current website content.
 *
 * Prerequisites:
 * 1. Enable Cloud Firestore in Firebase Console
 * 2. (Optional) Enable Storage — if unavailable, media is copied to /public and referenced locally
 * 3. Temporarily allow write in Firestore rules (see firestore.rules)
 * 4. Run: npm run seed:firebase
 */
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { config as loadEnv } from "dotenv";

import en from "../src/locales/en.json" with { type: "json" };
import ar from "../src/locales/ar.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env") });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? "AIzaSyA6rTHWzaQJVPxI9hyViPIv3g0R6d7f6O8",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "lunayairmarina-2d694.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "lunayairmarina-2d694",
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "lunayairmarina-2d694.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "640687266007",
  appId: process.env.VITE_FIREBASE_APP_ID ?? "1:640687266007:web:3effccbfa5897130277892",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-VB6Y6RRZFL",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

type L = { en: string; ar: string };
const L = (english: string, arabic: string): L => ({ en: english, ar: arabic });

let storageAvailable = true;

function contentType(path: string) {
  if (path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function uploadOrMirror(localRelative: string, storagePath: string): Promise<string> {
  const abs = resolve(root, localRelative);
  if (!existsSync(abs)) throw new Error(`Missing file: ${abs}`);

  if (storageAvailable) {
    try {
      const bytes = readFileSync(abs);
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, bytes, { contentType: contentType(localRelative) });
      const url = await getDownloadURL(storageRef);
      console.log(`✓ storage ${storagePath}`);
      return url;
    } catch (error) {
      storageAvailable = false;
      console.warn(
        `⚠ Storage unavailable (${error instanceof Error ? error.message : "error"}). Falling back to /public mirror.`,
      );
    }
  }

  const publicPath = resolve(root, "public", storagePath);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(abs, publicPath);
  const webPath = `/${storagePath.replace(/\\/g, "/")}`;
  console.log(`✓ public  ${webPath}`);
  return webPath;
}

async function main() {
  console.log("Seeding Firebase project:", firebaseConfig.projectId);

  const media = {
    heroImage: await uploadOrMirror("src/assets/hero-yacht.jpg", "images/hero/hero-yacht.jpg"),
    heroVideo: await uploadOrMirror("public/videos/hero.mp4", "videos/hero/hero.mp4"),
    about: await uploadOrMirror("src/assets/about-marina.jpg", "images/about/about-marina.jpg"),
    yacht1: await uploadOrMirror("src/assets/yacht-1.jpg", "images/services/yacht-1.jpg"),
    yacht2: await uploadOrMirror("src/assets/yacht-2.jpg", "images/services/yacht-2.jpg"),
    yacht3: await uploadOrMirror("src/assets/yacht-3.jpg", "images/fleet/yacht-3.jpg"),
    gallery1: await uploadOrMirror("src/assets/gallery-1.jpg", "images/gallery/gallery-1.jpg"),
    gallery2: await uploadOrMirror("src/assets/gallery-2.jpg", "images/gallery/gallery-2.jpg"),
    gallery3: await uploadOrMirror("src/assets/gallery-3.jpg", "images/gallery/gallery-3.jpg"),
    gallery4: await uploadOrMirror("src/assets/gallery-4.jpg", "images/gallery/gallery-4.jpg"),
    logo: await uploadOrMirror("src/assets/lunayairmarina.png", "images/brand/lunayairmarina.png"),
  };

  await setDoc(doc(db, "copy", "en"), en as Record<string, unknown>);
  await setDoc(doc(db, "copy", "ar"), ar as Record<string, unknown>);
  console.log("✓ copy/en + copy/ar");

  await setDoc(doc(db, "settings", "general"), {
    companyName: "lunayairmarina",
    phone: "966531561212",
    phoneDisplay: "+966 53 156 1212",
    whatsapp: "966531561212",
    email: "info@lunayairmarina.com",
    address: L(
      "Al Murjan Tower, Prince Sultan Road, Al Rawdah, Jeddah",
      "برج المرجان، طريق الأمير سلطان، حي الروضة، جدة",
    ),
    socialLinks: {
      instagram: "https://www.instagram.com/lunayairmarina",
      linkedin: "https://www.linkedin.com/company/lunayairmarina",
      facebook: "",
      youtube: "",
      tiktok: "https://vt.tiktok.com/ZSHVceVcD/",
      x: "https://x.com/lunayairmarina",
    },
  });
  console.log("✓ settings/general");

  await setDoc(doc(db, "homepage", "main"), {
    heroTitle: L(en.hero.title, ar.hero.title),
    heroDescription: L(en.hero.subtitle, ar.hero.subtitle),
    heroEyebrow: L(en.hero.eyebrow, ar.hero.eyebrow),
    heroVideo: media.heroVideo,
    heroImage: media.heroImage,
    primaryCTA: L(en.hero.primary, ar.hero.primary),
    secondaryCTA: L(en.hero.secondary, ar.hero.secondary),
    scrollLabel: L(en.hero.scroll, ar.hero.scroll),
  });
  console.log("✓ homepage/main");

  await setDoc(doc(db, "about", "main"), {
    title: L(en.about.title, ar.about.title),
    description: L(en.about.lead, ar.about.lead),
    lead: L(en.about.lead, ar.about.lead),
    body: L(en.about.body, ar.about.body),
    eyebrow: L(en.about.eyebrow, ar.about.eyebrow),
    mission: L(en.about.mission.body, ar.about.mission.body),
    vision: L(en.about.vision.body, ar.about.vision.body),
    values: en.about.values.map((item, i) => ({
      title: L(item.title, ar.about.values[i]?.title ?? item.title),
      description: L(item.description, ar.about.values[i]?.description ?? item.description),
    })),
    image: media.about,
    points: en.about.points.map((p, i) => L(p, ar.about.points[i] ?? p)),
    stats: en.about.stats.map((s, i) => ({
      value: s.value,
      suffix: s.suffix,
      label: L(s.label, ar.about.stats[i]?.label ?? s.label),
    })),
  });
  console.log("✓ about/main");

  await setDoc(doc(db, "why", "main"), {
    eyebrow: L(en.why.eyebrow, ar.why.eyebrow),
    title: L(en.why.title, ar.why.title),
    items: en.why.items.map((item, i) => ({
      title: L(item.title, ar.why.items[i]?.title ?? item.title),
      description: L(item.description, ar.why.items[i]?.description ?? item.description),
    })),
  });

  await setDoc(doc(db, "trust", "main"), {
    eyebrow: L(en.trust.eyebrow, ar.trust.eyebrow),
    title: L(en.trust.title, ar.trust.title),
    lead: L(en.trust.lead, ar.trust.lead),
    cta: L(en.trust.cta, ar.trust.cta),
    slots: en.trust.slots.map((slot, i) => ({
      title: L(slot.title, ar.trust.slots[i]?.title ?? slot.title),
      body: L(slot.body, ar.trust.slots[i]?.body ?? slot.body),
    })),
  });
  console.log("✓ why + trust");

  const serviceImages = [media.yacht1, media.yacht2, media.about, media.gallery3];
  const serviceGalleries = [
    [media.about, media.gallery1, media.gallery2],
    [media.gallery2, media.about, media.gallery3],
    [media.gallery3, media.yacht2, media.gallery1],
    [media.yacht1, media.gallery2, media.about],
  ];

  for (let i = 0; i < en.services.items.length; i++) {
    const item = en.services.items[i]!;
    const arItem = ar.services.items[i]!;
    const slug = item.slug;
    const detailsEn = (en.services.details as Record<string, unknown>)[slug];
    const detailsAr = (ar.services.details as Record<string, unknown>)[slug];
    await setDoc(doc(db, "services", slug), {
      slug,
      title: L(item.title, arItem.title),
      description: L(item.description, arItem.description),
      image: serviceImages[i] ?? media.yacht1,
      features: item.features.map((f, fi) => L(f, arItem.features[fi] ?? f)),
      order: i + 1,
      gallery: (serviceGalleries[i] ?? []).map((src, gi) => ({
        src,
        caption: L(
          ((detailsEn as { gallery?: Record<string, string> })?.gallery?.[`g${gi + 1}`] as string) ??
            `Gallery ${gi + 1}`,
          ((detailsAr as { gallery?: Record<string, string> })?.gallery?.[`g${gi + 1}`] as string) ??
            `معرض ${gi + 1}`,
        ),
      })),
      details: { en: detailsEn, ar: detailsAr },
    });
  }
  console.log("✓ services/*");

  const fleetSeed = [
    {
      id: "y1",
      yachtName: "Lunayair Dawn",
      yachtType: L("Motor Yacht", "يخت آلي"),
      yachtLength: "38 m",
      image: media.yacht1,
      description: L(
        "Managed motor yacht programme with planned maintenance and crew oversight.",
        "برنامج إدارة يخت آلي مع صيانة مخططة وإشراف على الطاقم.",
      ),
    },
    {
      id: "y2",
      yachtName: "Coral Explorer",
      yachtType: L("Explorer", "يخت استكشاف"),
      yachtLength: "45 m",
      image: media.yacht2,
      description: L(
        "Explorer yacht under full technical and operational management.",
        "يخت استكشاف تحت إدارة فنية وتشغيلية كاملة.",
      ),
    },
    {
      id: "y3",
      yachtName: "Meridian",
      yachtType: L("Sailing Yacht", "يخت شراعي"),
      yachtLength: "52 m",
      image: media.yacht3,
      description: L(
        "Sailing yacht with compliance, crew and seasonal readiness support.",
        "يخت شراعي مع دعم الامتثال والطواقم والاستعداد الموسمي.",
      ),
    },
  ];
  for (let i = 0; i < fleetSeed.length; i++) {
    const yacht = fleetSeed[i]!;
    await setDoc(doc(db, "fleet", yacht.id), { ...yacht, order: i + 1 });
  }
  console.log("✓ fleet/*");

  await setDoc(doc(db, "team", "tm1"), {
    name: L("Operations Lead", "قائد العمليات"),
    position: L("Yacht Management", "إدارة اليخوت"),
    image: media.gallery3,
    bio: L(
      "Profile placeholder for a senior yacht management lead.",
      "مكان جاهز لملف قائد إدارة يخوت أول.",
    ),
    order: 1,
  });
  console.log("✓ team/*");

  for (let i = 0; i < en.testimonials.items.length; i++) {
    const item = en.testimonials.items[i]!;
    const arItem = ar.testimonials.items[i]!;
    await setDoc(doc(db, "testimonials", `t${i + 1}`), {
      clientName: item.name,
      role: L(item.position, arItem.position),
      text: L(item.review, arItem.review),
      image: "",
      order: i + 1,
    });
  }
  console.log("✓ testimonials/*");

  await setDoc(doc(db, "locations", "jeddah"), {
    city: L("Jeddah", "جدة"),
    description: L(
      "Head operations desk serving Red Sea and Gulf yacht owners.",
      "مكتب العمليات الرئيسي لخدمة ملاك اليخوت في البحر الأحمر والخليج.",
    ),
  });
  await setDoc(doc(db, "locations", "gulf"), {
    city: L("Arabian Gulf", "الخليج العربي"),
    description: L(
      "Regional yacht management coverage across GCC waters.",
      "تغطية إقليمية لإدارة اليخوت عبر مياه دول الخليج.",
    ),
  });
  console.log("✓ locations/*");

  for (let i = 0; i < en.faq.items.length; i++) {
    const item = en.faq.items[i]!;
    const arItem = ar.faq.items[i]!;
    await setDoc(doc(db, "faq", `f${i + 1}`), {
      question: L(item.question, arItem.question),
      answer: L(item.answer, arItem.answer),
      order: i + 1,
    });
  }
  console.log("✓ faq/*");

  const gallerySeed = [
    { id: "g1", src: media.gallery1, caption: L("Sundeck jacuzzi", "جاكوزي السطح العلوي"), span: "tall" },
    { id: "g2", src: media.gallery2, caption: L("Marina operations", "عمليات المارينا"), span: "normal" },
    { id: "g3", src: media.gallery3, caption: L("Professional crew", "طاقم محترف"), span: "normal" },
    { id: "g4", src: media.gallery4, caption: L("Main salon", "الصالون الرئيسي"), span: "normal" },
    { id: "g5", src: media.heroImage, caption: L("Open water cruising", "الإبحار في المياه المفتوحة"), span: "normal" },
    { id: "g6", src: media.yacht2, caption: L("Private anchorage", "مرسى خاص"), span: "normal" },
    { id: "g7", src: media.about, caption: L("Berthing at dusk", "الرسو عند الغروب"), span: "normal" },
    { id: "g8", src: media.yacht3, caption: L("Sailing at golden hour", "إبحار عند الغروب"), span: "normal" },
  ];
  for (let i = 0; i < gallerySeed.length; i++) {
    const item = gallerySeed[i]!;
    await setDoc(doc(db, "gallery", item.id), { ...item, order: i + 1 });
  }
  console.log("✓ gallery/*");

  const blogPosts = [
    {
      id: "b1",
      slug: "yacht-management-red-sea-guide",
      title: L(
        "Complete Guide to Yacht Management in the Red Sea",
        "الدليل الشامل لإدارة اليخوت في البحر الأحمر",
      ),
      excerpt: L(
        "What yacht owners should expect from professional management across Jeddah, the Red Sea and the Arabian Gulf.",
        "ما الذي يتوقعه ملاك اليخوت من الإدارة الاحترافية في جدة والبحر الأحمر والخليج العربي.",
      ),
      content: L(
        "Professional yacht management in the Red Sea requires local compliance knowledge, crew readiness and transparent OPEX reporting.",
        "تتطلب إدارة اليخوت في البحر الأحمر معرفة محلية بالامتثال واستعداد الطواقم وتقارير تشغيل شفافة.",
      ),
      image: media.gallery2,
      date: "2026-06-12T09:00:00.000Z",
      status: "published",
      author: L("lunayairmarina Editorial", "فريق تحرير lunayairmarina"),
      seoTitle: L(
        "Yacht Management in the Red Sea | lunayairmarina",
        "إدارة اليخوت في البحر الأحمر | lunayairmarina",
      ),
      seoDescription: L(
        "Learn how professional yacht management works in the Red Sea with lunayairmarina.",
        "تعرّف على إدارة اليخوت الاحترافية في البحر الأحمر مع lunayairmarina.",
      ),
      order: 1,
    },
    {
      id: "b2",
      slug: "marina-operations-best-practices",
      title: L(
        "Marina Operations Best Practices for Luxury Yachts",
        "أفضل ممارسات تشغيل المارينا لليخوت الفاخرة",
      ),
      excerpt: L(
        "How disciplined berthing, safety and guest logistics elevate marina standards.",
        "كيف يرفع الرسو المنضبط والسلامة ولوجستيات الضيوف مستوى المارينا.",
      ),
      content: L(
        "World-class marina operations balance safety, guest experience and efficient berth allocation.",
        "تشغيل المارينا عالمي المستوى يوازن بين السلامة وتجربة الضيوف وتوزيع المراسي بكفاءة.",
      ),
      image: media.gallery1,
      date: "2026-05-04T09:00:00.000Z",
      status: "published",
      author: L("lunayairmarina Editorial", "فريق تحرير lunayairmarina"),
      seoTitle: L(
        "Marina Operations Best Practices | lunayairmarina",
        "أفضل ممارسات تشغيل المارينا | lunayairmarina",
      ),
      seoDescription: L(
        "Best practices for luxury marina operations across the Red Sea and Gulf.",
        "أفضل ممارسات تشغيل المارينا الفاخرة في البحر الأحمر والخليج.",
      ),
      order: 2,
    },
  ];
  for (const post of blogPosts) {
    await setDoc(doc(db, "blog", post.slug), post);
  }
  console.log("✓ blog/*");

  await setDoc(doc(db, "meta", "seed"), {
    seededAt: new Date().toISOString(),
    version: 1,
    storageMode: storageAvailable ? "firebase-storage" : "public-mirror",
    media,
  });

  console.log("\nSeed complete.");
  console.log(
    storageAvailable
      ? "Media uploaded to Firebase Storage."
      : "Media mirrored under /public (enable Storage later and re-run seed for CDN URLs).",
  );
  console.log("Tighten Firestore/Storage rules after seeding.");
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  console.error(
    "\nEnable Cloud Firestore in Firebase Console, allow temporary write in rules, then re-run: npm run seed:firebase",
  );
  process.exit(1);
});
