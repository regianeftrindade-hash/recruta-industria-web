/**
 * Alias estável de POST /api/account/locale.
 * Smoke scripts e clientes antigos às vezes chamam /api/locale.
 * Mantém o mesmo contrato (cookie ri-locale + opcional persistência na conta).
 */
import type { NextRequest } from "next/server";
import { POST as postAccountLocale } from "@/app/api/account/locale/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return postAccountLocale(request);
}
