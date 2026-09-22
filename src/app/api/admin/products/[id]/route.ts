import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json({ product: await updateProduct(id, await request.json()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(await deleteProduct(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove product." }, { status: 400 });
  }
}
