import { NextResponse } from "next/server";
import { createOrder } from "@/server/store-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createOrder({
      cart: Array.isArray(body.cart) ? body.cart.map((item: { sku?: string; quantity?: number }) => ({ sku: String(item.sku || ""), quantity: Number(item.quantity || 1) })) : [],
      couponCode: body.couponCode ? String(body.couponCode) : undefined,
      customer: {
        firstName: String(body.customer?.firstName || ""), lastName: String(body.customer?.lastName || ""),
        phone: String(body.customer?.phone || ""), email: String(body.customer?.email || "")
      },
      shipping: {
        governorate: String(body.shipping?.governorate || ""), city: String(body.shipping?.city || ""),
        street: String(body.shipping?.street || ""), notes: body.shipping?.notes ? String(body.shipping.notes) : undefined
      },
      paymentMethod: body.paymentMethod === "CARD" ? "CARD" : "COD",
      notes: body.notes ? String(body.notes) : undefined
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unable to place order.";
    console.error("[Checkout POST error]:", error);
    const isInternalError =
      rawMessage.includes("prisma") ||
      rawMessage.includes("Transaction") ||
      rawMessage.includes("invocation") ||
      rawMessage.includes("findUniqueOrThrow");
    const userMessage = isInternalError
      ? "حدث ضغط مؤقت أثناء معالجة الطلب، يرجى المحاولة مرة أخرى."
      : rawMessage;
    return NextResponse.json({ error: userMessage }, { status: 400 });
  }
}
