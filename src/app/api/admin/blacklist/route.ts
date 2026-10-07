import { NextResponse } from "next/server";
import { getSettings, toggleBlockPhone } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ blockedPhones: settings.blockedPhones || [] });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    if (!phone) {
      return NextResponse.json({ error: "رقم الهاتف مطلوب." }, { status: 400 });
    }

    const block = body.action === "unblock" || body.block === false ? false : true;
    const result = await toggleBlockPhone(phone, block);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تحديث حالة الحظر." },
      { status: 400 }
    );
  }
}
