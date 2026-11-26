import { NextResponse } from "next/server";

/**
 * Endpoint legado — não usar.
 * Não ecoa IDs de perfil (evita enumeração). Clientes antigos recebem 410.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Gone", profileId: null },
    { status: 410 },
  );
}
