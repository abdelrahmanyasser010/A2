import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, createAdminSession, validAdminCredentials } from "@/server/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");
  if (!validAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return NextResponse.json({ ok: true });
}
