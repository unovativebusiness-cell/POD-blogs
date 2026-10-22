export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Repair UTF-8 text that was stored as Latin-1 (â€™, â€", etc.). */
export function repairText(value: string | null | undefined): string {
  if (!value) return '';
  if (!value.includes('â')) return value;
  const chars = [...value];
  if (chars.some((char) => char.charCodeAt(0) > 255)) return value;
  const bytes = Uint8Array.from(chars, (char) => char.charCodeAt(0));
  const decoded = new TextDecoder('utf-8').decode(bytes);
  return decoded.includes('\uFFFD') ? value : decoded;
}

export function absoluteUrl(base: string, path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
