export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "qr",
  "login",
  "logout",
  "admin",
  "dashboard",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "_next",
  "static",
  "public",
  "u",
  "me",
  "cv",
]);

export function isReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
