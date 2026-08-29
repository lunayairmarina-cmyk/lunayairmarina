import { normalizeMessage } from "./normalize";

const PROGRESSIVE_TRIGGERS = [
  "وش بعد",
  "وش تشمل",
  "وبعدين",
  "عطيني تفاصيل اكثر",
  "تفاصيل اكثر",
  "تفاصيل",
  "زيدني",
  "more",
  "details",
  "more details",
  "what else",
  "tell me more",
];

export function isProgressiveTrigger(message: string): boolean {
  const norm = normalizeMessage(message);
  return PROGRESSIVE_TRIGGERS.some((t) => norm.includes(normalizeMessage(t)));
}

export function getProgressiveDisclosure(
  topic: string,
  level: number,
  language: "ar" | "en",
): { reply: string; nextLevel: number } {
  const currentLevel = Math.min(Math.max(level, 1), 4);

  if (topic.includes("yacht") || topic.includes("management")) {
    if (currentLevel === 1) {
      return {
        reply:
          language === "ar"
            ? "خدمات إدارة اليخوت تشمل التشغيل اليومي، صيانة المحركات والمعدات، وتجهيز اليخت للإبحار برفع مستوى الجاهزية."
            : "Yacht management services cover daily operations, engine and equipment maintenance, and vessel readiness.",
        nextLevel: 2,
      };
    }
    if (currentLevel === 2) {
      return {
        reply:
          language === "ar"
            ? "بالإضافة للتشغيل والصيانة، تشمل خدماتنا اختيار وتدريب الطواقم المحترفة، وإدارة عقود التأمين والتسجيل البحري."
            : "In addition to operations and maintenance, our services include professional crew recruitment, training, insurance, and flag registration.",
        nextLevel: 3,
      };
    }
    if (currentLevel === 3) {
      return {
        reply:
          language === "ar"
            ? "كما نوفر نظام تقارير OPEX شفاف لإدارة كافة المصاريف التشغيلية، مع الامتثال التام للوائح السلامة والملاحة المحلية والدولية."
            : "We also provide transparent OPEX reporting for operational expenses, alongside full compliance with local and international safety regulations.",
        nextLevel: 4,
      };
    }
    return {
      reply:
        language === "ar"
          ? "للبدء أو للحصول على عرض خطة مخصصة ليختك، يسعدنا التنسيق مع فريق الخبراء عبر الواتساب أو تحديد موعد استشارة."
          : "To get started or receive a customized proposal for your yacht, we are ready to connect you with our team via WhatsApp or schedule a consultation.",
      nextLevel: 4,
    };
  }

  // Fallback for general services
  if (currentLevel === 1) {
    return {
      reply:
        language === "ar"
          ? "نقدم حلولاً مارينا متكاملة تشمل إدارة اليخوت، خدمات المارينا والرسو، وتعيين الطواقم."
          : "We provide integrated marine solutions including yacht management, marina berthing, and crew placement.",
      nextLevel: 2,
    };
  }
  if (currentLevel === 2) {
    return {
      reply:
        language === "ar"
          ? "تشمل الخدمات أيضاً الوكالة الملاحية لليخوت الزائرة، والتخليص الجمركي والأمني، والصيانة الفنية."
          : "Services also extend to visiting yacht agency, security clearance, and technical maintenance.",
      nextLevel: 3,
    };
  }
  if (currentLevel === 3) {
    return {
      reply:
        language === "ar"
          ? "جميع خدماتنا تدار وفق أعلى المعايير الشفافة ومتابعة الأداء عبر تقارير دقيقة للملاك."
          : "All services are managed with maximum transparency and operational tracking reports for owners.",
      nextLevel: 4,
    };
  }
  return {
    reply:
      language === "ar"
        ? "يمكنك التواصل المباشر مع فريقنا للحصول على التفاصيل المخصصة لحالتك."
        : "Feel free to contact our team directly to discuss your specific requirements.",
    nextLevel: 4,
  };
}
