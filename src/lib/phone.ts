/**
 * Utility functions for Egyptian phone normalization, WhatsApp links, and blacklist checks.
 */

export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let s = String(rawPhone).trim();
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(arabicNumerals[i], String(i));
  }

  // Strip all non-digit characters
  let digits = s.replace(/\D/g, "");

  // Strip Egyptian international prefixes: 0020 or 20
  if (digits.startsWith("0020")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("20") && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // If 10 digits starting with 10, 11, 12, 15 (Egyptian mobile prefixes missing leading 0)
  if (digits.length === 10 && /^(10|11|12|15)/.test(digits)) {
    digits = "0" + digits;
  }

  return digits;
}

export function isPhoneBlocked(phone?: string | null, blockedPhones?: string[] | null): boolean {
  if (!phone || !blockedPhones || !Array.isArray(blockedPhones) || blockedPhones.length === 0) {
    return false;
  }
  const normalizedTarget = normalizePhone(phone);
  if (!normalizedTarget) return false;

  return blockedPhones.some((blocked) => {
    const normBlocked = normalizePhone(blocked);
    return normBlocked.length > 0 && normBlocked === normalizedTarget;
  });
}

export function toWhatsAppNumber(phone?: string | null): string {
  const norm = normalizePhone(phone);
  if (!norm) return "";
  // Egyptian standard mobile format (010, 011, 012, 015)
  if (norm.startsWith("01") && norm.length === 11) {
    return "20" + norm.slice(1);
  }
  // Already has 20 prefix
  if (norm.startsWith("20") && norm.length === 12) {
    return norm;
  }
  return norm;
}

export function formatWhatsAppMessage(order: {
  orderNumber: string;
  customer: { firstName: string; lastName: string };
  shipping: { governorate: string; city: string; street: string };
  items: { quantity: number; productName: string; color: string; size: string }[];
  grandTotal: number;
}): string {
  const name = order.customer.firstName?.trim() || "العميل";
  const itemsText = order.items
    .map((item) => `• ${item.quantity}× ${item.productName} (${item.color} / مقاس ${item.size})`)
    .join("\n");

  const address = `${order.shipping.governorate} - ${order.shipping.city} (${order.shipping.street})`;

  return `أهلاً بك يا ${name} 👋
معاك خدمة عملاء براند A² ستور.
بخصوص طلبك رقم #${order.orderNumber}:

${itemsText}

💰 إجمالي المبلغ عند الاستلام: ${order.grandTotal.toLocaleString("en-EG")} ج.م
📍 عنوان التوصيل: ${address}

حابين نأكد مع حضرتك تفاصيل الأوردر والمقاس قبل تجهيز الشحنة وإرسالها ليك. هل البيانات مظبوطة؟`;
}
