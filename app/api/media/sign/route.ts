import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { hasAdminAccess } from "@/lib/auth/admin-auth";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";
import {
  canSignMediaPath,
  createSignedMediaUrl,
  extractStoragePath,
  isPublicMediaFolder,
} from "@/lib/storage/private-uploads";

/**
 * Renova URL assinada de um arquivo no storage.
 * Pastas públicas (avatars/logos) não exigem login.
 * Documentos/vídeos exigem sessão + ownership (ou empresa/admin).
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

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const auth = await resolveAuthEmail(request);
    const isAdmin = hasAdminAccess({
      isAdmin: token?.isAdmin === true,
      email: auth?.email || (typeof token?.email === "string" ? token.email : null),
      role: typeof token?.userType === "string" ? token.userType : null,
    });

    if (!isPublicMediaFolder(path)) {
      if (!auth) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      const allowed = canSignMediaPath({
        path,
        email: auth.email,
        userId: typeof token?.sub === "string" ? token.sub : null,
        role: typeof token?.userType === "string" ? token.userType : null,
        isAdmin,
      });
      if (!allowed) {
        return NextResponse.json({ error: "Sem permissão para este arquivo" }, { status: 403 });
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
