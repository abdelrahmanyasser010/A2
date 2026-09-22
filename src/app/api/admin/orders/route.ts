import { NextResponse } from "next/server";
import { getOrders } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ orders: await getOrders() });
}
