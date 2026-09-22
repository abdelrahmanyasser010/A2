import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const settings = await updateSettings({
      flatShippingRate: Number(body.flatShippingRate),
      freeShippingThreshold: Number(body.freeShippingThreshold),
      codEnabled: Boolean(body.codEnabled),
      cardEnabled: Boolean(body.cardEnabled),
      lowStockThreshold: Number(body.lowStockThreshold),
      supportPhone: String(body.supportPhone || ""),
      supportEmail: String(body.supportEmail || ""),
      governorateRates: body.governorateRates && typeof body.governorateRates === "object" ? body.governorateRates : undefined
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save settings." }, { status: 400 });
  }
}
