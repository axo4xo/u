const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeTarget(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
  if (!url.hostname) return null;
  return url.toString();
}

export function shortUrlBase(): string {
  return process.env.SHORT_URL_BASE ?? "https://u.ax4.cz";
}
