export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  // Prepend https:// if no protocol is specified
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}
