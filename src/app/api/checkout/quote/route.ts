import { NextResponse } from "next/server";
import { quoteCheckout } from "@/server/store-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cart = Array.isArray(body.cart) ? body.cart.map((item: { sku?: string; quantity?: number }) => ({ sku: String(item.sku || ""), quantity: Number(item.quantity || 1) })) : [];
    return NextResponse.json({
      quote: await quoteCheckout(
        cart,
        body.couponCode ? String(body.couponCode) : undefined,
        body.governorate ? String(body.governorate) : undefined
      )
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to quote order." }, { status: 400 });
  }
}
