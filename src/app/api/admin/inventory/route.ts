import { NextResponse } from "next/server";
import { adjustInventory, getInventory } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getInventory());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.sku || !Number.isFinite(Number(body.delta)) || Number(body.delta) === 0) throw new Error("SKU and non-zero quantity adjustment are required.");
    return NextResponse.json(await adjustInventory({ sku: String(body.sku), delta: Number(body.delta), reason: String(body.reason || "Manual adjustment"), reference: body.reference ? String(body.reference) : undefined }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to adjust stock." }, { status: 400 });
  }
}
