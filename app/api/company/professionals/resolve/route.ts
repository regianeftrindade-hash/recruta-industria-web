import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint legado — não usar.
 * Mantido só para clientes antigos em cache não quebrarem com 500.
 */
export async function GET(request: NextRequest) {
  const ref = (request.nextUrl.searchParams.get("ref") || "").trim();
  if (/^c[a-z0-9]{20,}$/i.test(ref)) {
    return NextResponse.json({ profileId: ref, slug: ref });
  }
  return NextResponse.json(
    { error: "Abra o perfil pela vitrine novamente.", profileId: null },
    { status: 404 },
  );
}
