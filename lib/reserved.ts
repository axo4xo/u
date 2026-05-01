export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "qr",
  "login",
  "logout",
  "admin",
  "dashboard",
  "_next",
  "_vercel",
  "static",
  "public",
  "www",
  "app",
  "dev",
  "health",
  "u",
  "me",
  "cv",
]);

export function isReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
