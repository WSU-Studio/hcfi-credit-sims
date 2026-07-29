import { defineRouting } from "next-intl/routing";

/**
 * Locale preference cookie (`NEXT_LOCALE`).
 *
 * SOC finding #4: harden attributes on this non-auth cookie.
 * - `secure`: HTTPS-only in production (not set in local HTTP dev).
 * - `sameSite: 'lax'`: default next-intl value; keeps external-link entry working.
 * - `httpOnly` intentionally omitted: next-intl syncs the cookie from the
 *   client when the user switches locale (Next.js router cache can skip a
 *   server round-trip). Locale is not a session secret — impact remains Low.
 */
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});
