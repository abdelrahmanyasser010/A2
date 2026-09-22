import { NextResponse } from "next/server";
import { createProduct, getAdminProducts } from "@/server/store-db";
import { isAdminAuthenticated } from "@/server/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ products: await getAdminProducts() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const product = await createProduct(await request.json());
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create product." }, { status: 400 });
  }
}
