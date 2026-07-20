/** Format API JSON error bodies for admin forms (Zod field + message). */

export function formatAdminApiError(
  data: { error?: unknown; field?: unknown; message?: unknown },
  fallback: string
): string {
  const message = typeof data.message === 'string' ? data.message : '';
  const field = typeof data.field === 'string' ? data.field : '';
  if (message) return field ? `${field}: ${message}` : message;
  if (typeof data.error === 'string' && data.error) return data.error;
  return fallback;
}
