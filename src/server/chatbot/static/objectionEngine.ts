export type ObjectionType =
  | "PRICE_OBJECTION"
  | "HESITATION"
  | "COMPARISON"
  | "NO_CONTACT_OBJECTION";

export interface ObjectionResponse {
  handled: boolean;
  objectionType?: ObjectionType;
  reply: string;
}

export function handleObjection(
  objectionType: ObjectionType | undefined,
  language: "ar" | "en",
  lastIntent?: string,
): ObjectionResponse {
  if (!objectionType) {
    return { handled: false, reply: "" };
  }

  if (objectionType === "PRICE_OBJECTION") {
    const reply =
      language === "ar"
        ? "تفهم منطقي تماماً. أسعار إدارة وتجهيز اليخوت تعتمد كلياً على احتياج اليخت الفعلي ونطاق التشغيل بدون تكاليف إضافية غير مبررة. هدفنا هو تحسين مصاريف التشغيل (OPEX) وتقديم شفافية كاملة في الفواتير بدون مبالغة. إذا حاب، نقدر نناقش خطة مخصصة تناسب ميزانيتك."
        : "Completely understand your perspective. Yacht management and operational costs depend directly on actual vessel requirements and scope, avoiding unneeded markups. Our focus is OPEX transparency and tailored efficiency. If helpful, we can outline a customized approach aligned with your budget.";
    return { handled: true, objectionType, reply };
  }

  if (objectionType === "HESITATION") {
    const reply =
      language === "ar"
        ? "خذ وقتك بالكامل. التخطيط لإدارة اليخت أو خدمات المارينا يحتاج دراسة دقيقة. نحن متواجدون بأي وقت لمساعدتك بأي استفسار أو تزويدك بالمعلومات بدون أي التزام."
        : "Take all the time you need. Planning yacht management or marine operations requires careful thought. We remain at your service whenever you wish to ask questions or review details without any commitment.";
    return { handled: true, objectionType, reply };
  }

  if (objectionType === "COMPARISON") {
    const reply =
      language === "ar"
        ? "مقارنة الخيارات خطوة ممتازة لضمان أفضل قيمة. تميزنا يرتكز على الإدارة الشاملة 360° والشفافية التامة في تقارير المصاريف والالتزام بالمعايير التنظيمية والملاحية. يسعدنا تقديم مقارنة تفصيلية لنطاق خدماتنا متى ما رغبت."
        : "Comparing options is a great practice to ensure the best value. Our strength lies in 360° management, full transparency in operational reporting, and strict regulatory compliance. We welcome providing a detailed comparison of our service scope whenever convenient.";
    return { handled: true, objectionType, reply };
  }

  if (objectionType === "NO_CONTACT_OBJECTION") {
    const reply =
      language === "ar"
        ? "لا قلق إطلاقاً. يمكنك استكشاف جميع خدماتنا ومراجعة تفاصيل الموقع براحتك. متى ما احتجت أي توضيح، سنكون سعداء بالإجابة هنا."
        : "No worries at all. Feel free to explore our website and service details at your own pace. Whenever you need assistance, we're glad to answer right here.";
    return { handled: true, objectionType, reply };
  }

  return { handled: false, reply: "" };
}
