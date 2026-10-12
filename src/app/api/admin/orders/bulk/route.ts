import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";
import type { OrderStatus } from "@/lib/domain";

const allowed: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED"
];

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "لم يتم تحديد أي طلبات." }, { status: 400 });
    }
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة." }, { status: 400 });
    }

    const updated = [];
    for (const id of ids) {
      try {
        const order = await updateOrderStatus(id, status, "تحديث مجمّع من لوحة الإدارة");
        updated.push(order);
      } catch (err) {
        console.error(`Failed to update order ${id}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: updated.length, orders: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تحديث الطلبات المحددة." },
      { status: 400 }
    );
  }
}
