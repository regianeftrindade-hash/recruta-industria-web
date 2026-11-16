export const LOCALE_COOKIE = "ri-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** HTTPS de produção marca o cookie como secure. HTTP local continua gravando. */
export function localeCookieOptions(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return {
    path: "/",
    sameSite: "lax" as const,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: nodeEnv === "production",
  };
}
