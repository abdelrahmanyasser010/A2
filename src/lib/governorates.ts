export type GovernorateInfo = {
  id: string;
  nameEn: string;
  nameAr: string;
  defaultRate: number;
};

export const EGYPT_GOVERNORATES: GovernorateInfo[] = [
  { id: "cairo", nameEn: "Cairo", nameAr: "القاهرة", defaultRate: 50 },
  { id: "giza", nameEn: "Giza", nameAr: "الجيزة", defaultRate: 50 },
  { id: "alexandria", nameEn: "Alexandria", nameAr: "الإسكندرية", defaultRate: 60 },
  { id: "qalyubia", nameEn: "Qalyubia", nameAr: "القليوبية", defaultRate: 60 },
  { id: "sharqia", nameEn: "Sharqia", nameAr: "الشرقية", defaultRate: 65 },
  { id: "dakahlia", nameEn: "Dakahlia", nameAr: "الدقهلية", defaultRate: 65 },
  { id: "gharbia", nameEn: "Gharbia", nameAr: "الغربية", defaultRate: 65 },
  { id: "monufia", nameEn: "Monufia", nameAr: "المنوفية", defaultRate: 65 },
  { id: "beheira", nameEn: "Beheira", nameAr: "البحيرة", defaultRate: 65 },
  { id: "kafr-el-sheikh", nameEn: "Kafr El Sheikh", nameAr: "كفر الشيخ", defaultRate: 65 },
  { id: "damietta", nameEn: "Damietta", nameAr: "دمياط", defaultRate: 65 },
  { id: "port-said", nameEn: "Port Said", nameAr: "بورسعيد", defaultRate: 65 },
  { id: "ismailia", nameEn: "Ismailia", nameAr: "الإسماعيلية", defaultRate: 65 },
  { id: "suez", nameEn: "Suez", nameAr: "السويس", defaultRate: 65 },
  { id: "fayoum", nameEn: "Fayoum", nameAr: "الفيوم", defaultRate: 70 },
  { id: "beni-suef", nameEn: "Beni Suef", nameAr: "بني سويف", defaultRate: 70 },
  { id: "minya", nameEn: "Minya", nameAr: "المنيا", defaultRate: 75 },
  { id: "asyut", nameEn: "Asyut", nameAr: "أسيوط", defaultRate: 80 },
  { id: "sohag", nameEn: "Sohag", nameAr: "سوهاج", defaultRate: 80 },
  { id: "qena", nameEn: "Qena", nameAr: "قنا", defaultRate: 85 },
  { id: "luxor", nameEn: "Luxor", nameAr: "الأقصر", defaultRate: 85 },
  { id: "aswan", nameEn: "Aswan", nameAr: "أسوان", defaultRate: 90 },
  { id: "red-sea", nameEn: "Red Sea", nameAr: "البحر الأحمر", defaultRate: 95 },
  { id: "matrouh", nameEn: "Matrouh", nameAr: "مطروح", defaultRate: 95 },
  { id: "new-valley", nameEn: "New Valley", nameAr: "الوادي الجديد", defaultRate: 100 },
  { id: "north-sinai", nameEn: "North Sinai", nameAr: "شمال سيناء", defaultRate: 100 },
  { id: "south-sinai", nameEn: "South Sinai", nameAr: "جنوب سيناء", defaultRate: 100 }
];

export function normalizeGovKey(input?: string): string {
  if (!input) return "";
  const cleaned = input.toLowerCase().trim();
  const match = EGYPT_GOVERNORATES.find(
    (g) => g.id === cleaned || g.nameEn.toLowerCase() === cleaned || g.nameAr === input.trim()
  );
  return match ? match.nameEn : input.trim();
}

export function getDefaultGovRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const gov of EGYPT_GOVERNORATES) {
    rates[gov.nameEn] = gov.defaultRate;
  }
  return rates;
}
