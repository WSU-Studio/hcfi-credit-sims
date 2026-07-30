/**
 * Probe / attack-surface paths that this app does not implement.
 * Block early in middleware so catch-all CMS routes (e.g. [pageSlug]) never
 * appear to "expose" GraphQL or similar scanners' targets.
 */
const BLOCKED_SEGMENTS = new Set([
  'graphql',
  'graphiql',
  'playground',
  'altair',
  'phpmyadmin',
  'wp-admin',
  'wp-login.php',
  'wp-login',
  '.env',
  '.git',
]);

/**
 * Returns true when the pathname (with or without locale prefix) should 404.
 * Examples: /graphql, /id/graphql, /en/api/graphql
 */
export function isBlockedProbePath(pathname: string): boolean {
  const parts = pathname
    .split('/')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  // Drop leading locale if present (id|en).
  const segs =
    parts[0] === 'id' || parts[0] === 'en' ? parts.slice(1) : parts;

  if (segs.length === 0) return false;

  // Exact segment match anywhere (e.g. /api/graphql, /graphql/v1).
  return segs.some((s) => BLOCKED_SEGMENTS.has(s));
}
