import { NextResponse } from "next/server";
import { createDiscount, getDiscounts } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ discounts: await getDiscounts() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ discount: await createDiscount(await request.json()) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create discount." }, { status: 400 });
  }
}
