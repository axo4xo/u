import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidCharset } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (!isValidCharset(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const link = await db.link.findUnique({
    where: { slug },
    select: { target: true },
  });
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.redirect(link.target, 302);
}
