import { NextResponse } from "next/server";
import { requestReturn } from "@/server/store-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await requestReturn(String(body.orderNumber || ""), String(body.phone || ""), String(body.reason || ""));
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to request return." }, { status: 400 });
  }
}
