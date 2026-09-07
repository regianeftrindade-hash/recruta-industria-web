import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";
import {
  createSignedMediaUrl,
  extractStoragePath,
  isPublicMediaFolder,
} from "@/lib/storage/private-uploads";

/**
 * Renova URL assinada de um arquivo no storage.
 * Pastas públicas (avatars/logos) não exigem login.
 * Documentos exigem sessão.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`media-sign:${ip}`, 60, 60_000))) {
      return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
    }

    const raw = request.nextUrl.searchParams.get("path")
      || request.nextUrl.searchParams.get("url")
      || "";
    const path = extractStoragePath(raw) || raw.replace(/^\/+/, "");

    if (!path || path.includes("..")) {
      return NextResponse.json({ error: "Path inválido" }, { status: 400 });
    }

    if (!isPublicMediaFolder(path)) {
      const auth = await resolveAuthEmail(request);
      if (!auth) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
    }

    const signedUrl = await createSignedMediaUrl(path);
    if (!signedUrl) {
      return NextResponse.json({ error: "Não foi possível assinar o arquivo" }, { status: 404 });
    }

    const redirect = request.nextUrl.searchParams.get("redirect") === "1";
    if (redirect) {
      return NextResponse.redirect(signedUrl, 302);
    }

    return NextResponse.json({
      success: true,
      path,
      url: signedUrl,
      expiresIn: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    console.error("Erro ao assinar mídia:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
