import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/server/store-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await getOrderByNumber(String(body.orderNumber || ""));
    if (!order || order.customer.phone !== String(body.phone || "")) return NextResponse.json({ error: "Order not found. Check order number and phone." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to find order." }, { status: 400 });
  }
}
