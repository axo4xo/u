import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mintRandomSlug, validateCustomSlug } from "@/lib/slug";
import { normalizeTarget, shortUrlBase } from "@/lib/url";

export const runtime = "nodejs";

type Body = {
  target?: unknown;
  slug?: unknown;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const target =
    typeof body.target === "string" ? normalizeTarget(body.target) : null;
  if (!target) {
    return NextResponse.json(
      { error: "Provide a valid http(s) URL" },
      { status: 400 },
    );
  }

  let slug: string;
  if (typeof body.slug === "string" && body.slug.length > 0) {
    const err = validateCustomSlug(body.slug);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const taken = await db.link.findUnique({
      where: { slug: body.slug },
      select: { slug: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That slug is already taken" },
        { status: 409 },
      );
    }
    slug = body.slug;
  } else {
    slug = await mintRandomSlug();
  }

  const link = await db.link.create({ data: { slug, target } });
  return NextResponse.json({
    slug: link.slug,
    target: link.target,
    shortUrl: `${shortUrlBase()}/${link.slug}`,
  });
}
