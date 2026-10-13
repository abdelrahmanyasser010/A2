export function formatCheckoutError(
  rawMessage: string | null | undefined,
  language: "ar" | "en" = "ar"
): string {
  if (!rawMessage) return "";

  const msg = String(rawMessage).trim();

  // 1. Prisma / Database / Transaction internal errors
  if (
    msg.includes("prisma") ||
    msg.includes("Transaction") ||
    msg.includes("invocation") ||
    msg.includes("findUniqueOrThrow") ||
    msg.includes("Connection") ||
    msg.includes("ConnectorError") ||
    msg.includes("timeout") ||
    msg.includes("Timed out")
  ) {
    return language === "ar"
      ? "حدث ضغط مؤقت أثناء معالجة الطلب، يرجى المحاولة مرة أخرى."
      : "A temporary connection error occurred while processing your order. Please try again.";
  }

  // 2. Unavailable item / SKU
  // Matches "Item <SKU> is no longer available."
  const itemMatch = msg.match(/Item\s+([A-Za-z0-9_-]+)\s+is no longer available/i);
  if (itemMatch) {
    const sku = itemMatch[1];
    return language === "ar"
      ? `المنتج (${sku}) غير متوفر حالياً في المخزن. يرجى حذفه من السلة للمتابعة.`
      : `Item (${sku}) is no longer available. Please remove it from your bag to continue.`;
  }

  // 3. Stock limit
  // Matches "<Product> (<color>/<size>) only has <N> left."
  const stockMatch = msg.match(/^(.*)\s+only has\s+(\d+)\s+left\.?$/i);
  if (stockMatch) {
    const [, name, count] = stockMatch;
    return language === "ar"
      ? `الكمية المتبقية من ${name} هي ${count} فقط بالمخزن.`
      : `Only ${count} left in stock for ${name}.`;
  }

  // 4. Stock changed during checkout
  const changedStockMatch = msg.match(/(.*)\s+changed stock while you were checking out/i);
  if (changedStockMatch) {
    const [, name] = changedStockMatch;
    return language === "ar"
      ? `تغيرت كمية المخزون لـ (${name}) أثناء إتمام الشراء. يرجى مراجعة سلتك.`
      : `Stock for (${name}) changed while placing your order. Please review your bag.`;
  }

  // 5. Empty bag
  if (/bag is empty/i.test(msg) || /سلة.*فارغة/i.test(msg)) {
    return language === "ar" ? "سلة المشتريات فارغة." : "Your shopping bag is empty.";
  }

  // 6. Coupon errors
  if (/coupon not found/i.test(msg)) {
    return language === "ar" ? "كود الخصم غير موجود أو غير صحيح." : "Coupon not found.";
  }
  if (/coupon is inactive or expired/i.test(msg)) {
    return language === "ar" ? "كود الخصم غير مفعّل أو انتهت صلاحيته." : "This coupon is inactive or expired.";
  }
  const minSpendMatch = msg.match(/Minimum spend is\s+([\d,.]+)\s+EGP/i);
  if (minSpendMatch) {
    return language === "ar"
      ? `الحد الأدنى للطلب لتفعيل هذا الكوبون هو ${minSpendMatch[1]} ج.م.`
      : `Minimum spend is ${minSpendMatch[1]} EGP.`;
  }
  if (/coupon does not apply/i.test(msg)) {
    return language === "ar" ? "كود الخصم لا ينطبق على المنتجات الموجودة بالسلة." : "Coupon does not apply to these items.";
  }
  if (/coupon applied/i.test(msg)) {
    return language === "ar" ? "تم تطبيق كود الخصم بنجاح!" : "Coupon applied successfully!";
  }

  // 7. Form validation & payment methods
  if (/first name is required/i.test(msg)) {
    return language === "ar" ? "الاسم الأول مطلوب." : "First name is required.";
  }
  if (/complete delivery address is required/i.test(msg)) {
    return language === "ar" ? "يرجى إدخال عنوان التوصيل بالتفصيل (المحافظة والمدينة والشارع)." : "Complete delivery address is required.";
  }
  if (/رقم الهاتف مطلوب/i.test(msg)) {
    return language === "ar" ? "رقم الهاتف مطلوب بشكل صحيح (11 رقم يبدأ بـ 01)." : "A valid Egyptian mobile number is required.";
  }
  if (/online card payment is not enabled/i.test(msg)) {
    return language === "ar" ? "الدفع الإلكتروني بالبطاقة غير متاح حالياً. متاح الدفع عند الاستلام." : "Online card payment is not enabled yet.";
  }
  if (/cash on delivery is not available/i.test(msg)) {
    return language === "ar" ? "الدفع عند الاستلام غير متاح حالياً." : "Cash on delivery is not available.";
  }
  if (/عذراً، هذا الرقم غير متاح/i.test(msg)) {
    return language === "ar"
      ? "عذراً، هذا الرقم غير متاح لتقديم طلبات جديدة. يرجى التواصل مع خدمة العملاء للمساعدة."
      : "Sorry, this phone number cannot place new orders. Please contact customer service.";
  }
  if (/order not found/i.test(msg)) {
    return language === "ar" ? "لم يتم العثور على الطلب." : "Order not found.";
  }
  if (/unable to place order/i.test(msg) || /unable to calculate order/i.test(msg)) {
    return language === "ar" ? "تعذر إتمام الطلب حالياً، يرجى المحاولة مرة أخرى." : "Unable to place order. Please try again.";
  }

  return msg;
}

export function extractUnavailableSku(errorMessage: string | null | undefined): string | null {
  if (!errorMessage) return null;
  const match = String(errorMessage).match(/Item\s+([A-Za-z0-9_-]+)\s+is no longer available/i);
  return match ? match[1] : null;
}
