import { NextResponse } from "next/server";
import { deleteDiscount, updateDiscount } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json({ discount: await updateDiscount(id, await request.json()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update discount." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(await deleteDiscount(id));
}
