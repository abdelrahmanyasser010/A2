export type Language = "en" | "ar";

export const translations = {
  en: {
    // Navigation
    navNewDrop: "New Drop",
    navShop: "Shop",
    navEssentials: "Essentials",
    navAbout: "About",
    navWishlist: "Wishlist",
    navOrders: "Orders",
    navSearch: "Search",
    navBag: "Shopping Bag",
    
    // Checkout
    checkoutBadge: "SECURE CHECKOUT",
    checkoutTitle: "Checkout",
    checkoutSubtitle: "Fast, mobile-first checkout with live governorate shipping calculation.",
    contactLegend: "Contact",
    phoneLabel: "Phone",
    phonePlaceholder: "01xxxxxxxxx",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    addressLegend: "Delivery address",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    governorateLabel: "Governorate",
    selectGovernorate: "Select governorate / اختر المحافظة",
    cityLabel: "Area / City",
    cityPlaceholder: "e.g. Nasr City, Dokki, Smouha...",
    streetLabel: "Street and building",
    streetPlaceholder: "Street name, building number, apartment",
    notesLabel: "Delivery notes",
    notesPlaceholder: "Special delivery instructions, landmarks...",
    paymentLegend: "Payment",
    codTitle: "Cash on delivery",
    codDesc: "Pay when your order arrives.",
    cardTitle: "Online card",
    cardDesc: "Available when the payment gateway is enabled from admin.",
    placeOrderBtn: "Place order",
    placingOrderBtn: "Placing order…",
    emptyBagTitle: "Your bag is empty.",
    shopTheDropBtn: "Shop the drop",
    orderReceivedBadge: "ORDER",
    orderReceivedTitle: "Order received.",
    orderReceivedDesc: "We've reserved the selected stock for delivery to {gov}. Use your order number and phone to track every status update.",
    trackOrderBtn: "Track order",
    backHomeBtn: "Back home",
    
    // Summary
    orderSummaryBadge: "YOUR ORDER",
    couponPlaceholder: "Coupon code",
    applyBtn: "Apply",
    subtotal: "Subtotal",
    discounts: "Discounts",
    shipping: "Shipping",
    free: "Free",
    total: "Total",

    // Language Toggle
    switchLang: "عربي"
  },
  ar: {
    // Navigation
    navNewDrop: "أحدث المنتجات",
    navShop: "المتجر",
    navEssentials: "الأساسيات",
    navAbout: "عن البراند",
    navWishlist: "المفضلة",
    navOrders: "طلباتي",
    navSearch: "بحث",
    navBag: "حقيبة التسوق",
    
    // Checkout
    checkoutBadge: "إتمام الطلب بأمان",
    checkoutTitle: "الدفع وتأكيد الطلب",
    checkoutSubtitle: "شحن سريع وحساب فوري لتكلفة التوصيل حسب محافظتك.",
    contactLegend: "بيانات التواصل",
    phoneLabel: "رقم الموبايل",
    phonePlaceholder: "01xxxxxxxxx",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    addressLegend: "عنوان التوصيل",
    firstNameLabel: "الاسم الأول",
    lastNameLabel: "اسم العائلة",
    governorateLabel: "المحافظة",
    selectGovernorate: "اختر المحافظة",
    cityLabel: "المنطقة / المدينة",
    cityPlaceholder: "مثال: مدينة نصر، الدقي، سموحة...",
    streetLabel: "اسم الشارع ورقم العمارة والشقة",
    streetPlaceholder: "الشارع، رقم العقار، الشقة أو علامة مميزة",
    notesLabel: "ملاحظات إضافية للتوصيل",
    notesPlaceholder: "أي تعليمات خاصة للمندوب أو علامة مميزة للعنوان...",
    paymentLegend: "طريقة الدفع",
    codTitle: "الدفع عند الاستلام (Cash on Delivery)",
    codDesc: "ادفع كاش للمندوب وقت استلام الأوردر.",
    cardTitle: "الدفع الإلكتروني (فيزا / ماستركارد)",
    cardDesc: "سيكون متاحاً عند تفعيل بوابة الدفع من الإدارة.",
    placeOrderBtn: "تأكيد الطلب",
    placingOrderBtn: "جاري تأكيد الطلب…",
    emptyBagTitle: "حقيبة التسوق فارغة حالياً.",
    shopTheDropBtn: "تصفح المنتجات الآن",
    orderReceivedBadge: "تم استلام الطلب رقم",
    orderReceivedTitle: "تم استلام طلبك بنجاح!",
    orderReceivedDesc: "تم حجز المنتجات وجاري تجهيز الشحن إلى {gov}. احتفظ برقم الطلب لمتابعة حالة شحنتك.",
    trackOrderBtn: "تتبع حالة الطلب",
    backHomeBtn: "العودة للرئيسية",
    
    // Summary
    orderSummaryBadge: "ملخص طلبك",
    couponPlaceholder: "كود الخصم (كوبون)",
    applyBtn: "تطبيق",
    subtotal: "المجموع الفرعي",
    discounts: "الخصومات",
    shipping: "مصاريف الشحن",
    free: "مجاناً",
    total: "الإجمالي الكلي",

    // Language Toggle
    switchLang: "English"
  }
};

export type TranslationKey = keyof typeof translations.en;
