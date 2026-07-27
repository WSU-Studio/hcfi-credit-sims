/**
 * Shared href allowlist: relative paths, http(s), mailto, tel.
 * Blocks javascript:, data:, protocol-relative, and unknown schemes.
 */
import { z } from 'zod';

const MAX_HREF = 2048;

export function isSafeHref(url: string): boolean {
  const s = url.trim();
  if (!s || s.length > MAX_HREF) return false;

  // Internal path (not protocol-relative //evil.com)
  if (s.startsWith('/') && !s.startsWith('//')) {
    return !/[\s<>"']/.test(s);
  }

  try {
    const parsed = new URL(s);
    const protocol = parsed.protocol.toLowerCase();
    return (
      protocol === 'http:' ||
      protocol === 'https:' ||
      protocol === 'mailto:' ||
      protocol === 'tel:'
    );
  } catch {
    return false;
  }
}

/** Returns the trimmed URL if safe, otherwise null. */
export function sanitizeHref(url: string | null | undefined): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (!s) return null;
  return isSafeHref(s) ? s.slice(0, MAX_HREF) : null;
}

/** Zod: optional/nullable href; empty → null; rejects unsafe schemes. */
export const safeHrefSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === '-') return null;
    return s.slice(0, MAX_HREF);
  })
  .refine((v) => v == null || isSafeHref(v), {
    message: 'URL tidak valid (hanya /, http(s), mailto, tel)',
  });

/** Required non-empty safe href (e.g. banner imageUrl). */
export const requiredSafeHrefSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return '';
    return String(v).trim().slice(0, MAX_HREF);
  })
  .refine((v) => v.length > 0 && isSafeHref(v), {
    message: 'URL wajib dan harus valid (/, http(s), mailto, tel)',
  });
