import { db } from "./db";
import { isReserved } from "./reserved";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_RE = /^[A-Za-z0-9]+$/;

export const MIN_RANDOM_LEN = 3;
export const MIN_CUSTOM_LEN = 4;
export const MAX_LEN = 32;

const MAX_ATTEMPTS_PER_LEN = 8;

function randomSlug(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function isValidCharset(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function validateCustomSlug(slug: string): string | null {
  if (!isValidCharset(slug)) return "Slug must be [A-Za-z0-9] only";
  if (slug.length < MIN_CUSTOM_LEN)
    return `Custom slugs must be at least ${MIN_CUSTOM_LEN} characters`;
  if (slug.length > MAX_LEN) return `Slug too long (max ${MAX_LEN})`;
  if (isReserved(slug)) return "That slug is reserved";
  return null;
}

/**
 * Mint an unused random slug. Tries MAX_ATTEMPTS_PER_LEN at the current length,
 * then bumps length by one and retries — this naturally absorbs collision pressure
 * as the namespace fills up. Old short slugs keep resolving regardless.
 */
export async function mintRandomSlug(): Promise<string> {
  let len = MIN_RANDOM_LEN;
  while (len <= MAX_LEN) {
    for (let i = 0; i < MAX_ATTEMPTS_PER_LEN; i++) {
      const candidate = randomSlug(len);
      if (isReserved(candidate)) continue;
      const existing = await db.link.findUnique({
        where: { slug: candidate },
        select: { slug: true },
      });
      if (!existing) return candidate;
    }
    len++;
  }
  throw new Error("Unable to mint a unique slug");
}
