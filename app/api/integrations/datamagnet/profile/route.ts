import { NextRequest, NextResponse } from "next/server";
import { importDatamagnetProfileFromUrl } from "@/lib/integrations/datamagnet-client";
import {
  insertDatamagnetProfile,
  parseDatamagnetProfile,
  validateDatamagnetIngestKey,
} from "@/lib/integrations/datamagnet-profile";

function readIngestKey(request: NextRequest): string | null {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return header;

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function POST(request: NextRequest) {
  if (!validateDatamagnetIngestKey(readIngestKey(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof (body as { url?: unknown }).url === "string"
  ) {
    const result = await importDatamagnetProfileFromUrl(
      (body as { url: string }).url,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      { success: true, profileId: result.profileId, userId: result.userId },
      { status: 201 },
    );
  }

  const parsed = parseDatamagnetProfile(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await insertDatamagnetProfile(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      success: true,
      profileId: result.profileId,
      userId: result.userId,
    },
    { status: 201 },
  );
}
