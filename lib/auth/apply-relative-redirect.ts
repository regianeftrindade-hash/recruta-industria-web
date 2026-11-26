import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Aplica um href relativo (path + query opcional) em um redirect Next.js.
 * Evita o bug de `url.pathname = "/?acesso=empresa"` → `/%3Facesso=empresa`.
 */
export function applyRelativeRedirect(
  request: NextRequest,
  redirectPath: string,
  opts?: { preserveRedirectFrom?: string | null },
): NextResponse {
  const url = request.nextUrl.clone();
  const raw = String(redirectPath || "/").trim() || "/";
  const qIndex = raw.indexOf("?");
  const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : "";

  url.pathname = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  url.search = "";

  if (query) {
    const params = new URLSearchParams(query);
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const preserve = opts?.preserveRedirectFrom;
  if (preserve && preserve.startsWith("/") && !preserve.startsWith("//")) {
    url.searchParams.set("redirect", preserve);
  }

  return NextResponse.redirect(url);
}
