/**
 * Shared password strength rules for admin create/update and self-service change.
 */
export const PASSWORD_MIN_LENGTH = 12;

export type PasswordPolicyResult =
  | { ok: true; password: string }
  | { ok: false; error: string };

/**
 * Validate a new password. Returns trimmed password on success.
 * Rules: min 12 chars, at least one uppercase, one lowercase, one digit.
 */
export function validatePasswordPolicy(raw: unknown): PasswordPolicyResult {
  if (typeof raw !== 'string') {
    return { ok: false, error: `Password minimal ${PASSWORD_MIN_LENGTH} karakter` };
  }
  const password = raw.trim();
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
    };
  }
  if (password.length > 128) {
    return { ok: false, error: 'Password terlalu panjang (max 128)' };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: 'Password harus mengandung huruf kecil' };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: 'Password harus mengandung huruf besar' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: 'Password harus mengandung angka' };
  }
  return { ok: true, password };
}
