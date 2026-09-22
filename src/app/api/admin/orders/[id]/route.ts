import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";
import type { OrderStatus } from "@/lib/domain";

const allowed: OrderStatus[] = ["NEW","CONFIRMED","PREPARING","SHIPPED","DELIVERED","CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!allowed.includes(body.status)) throw new Error("Invalid order status.");
    const { id } = await params;
    const order = await updateOrderStatus(id, body.status, body.note);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update order." }, { status: 400 });
  }
}
