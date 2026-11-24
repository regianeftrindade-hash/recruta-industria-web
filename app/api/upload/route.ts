import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthEmail } from '@/lib/auth/api-auth';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';
import { uploadPrivateFile } from '@/lib/storage/private-uploads';

const MAX_FILE_SIZE_AUTH = 10 * 1024 * 1024;
const MAX_FILE_SIZE_ANON = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Pastas permitidas no cadastro pré-login (profissional). */
const ANON_ALLOWED_UPLOAD_TYPES = new Set([
  'documents',
  'images',
  'avatars',
  'curriculos',
  'cnpj',
]);

/** Demais pastas exigem sessão autenticada. */
const AUTH_REQUIRED_UPLOAD_TYPES = new Set([
  'logos',
  'certificados',
  'company-cnpj',
  'company-logo',
  'company-responsavel',
  'cnh-documentos',
  'curso-certificados',
]);

const ALLOWED_UPLOAD_TYPES = new Set([
  ...ANON_ALLOWED_UPLOAD_TYPES,
  ...AUTH_REQUIRED_UPLOAD_TYPES,
]);

function looksLikeAllowedFile(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 4) return false;
  if (mime === 'application/pdf') return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mime === 'image/gif') return buffer.subarray(0, 3).toString('ascii') === 'GIF';
  if (mime === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (mime.includes('word') || mime.includes('msword')) {
    return buffer[0] === 0xd0 || buffer.subarray(0, 2).toString('ascii') === 'PK';
  }
  return false;
}

function sanitizeOwnerPrefix(value: string): string {
  return value.replace(/[^a-z0-9@._-]/gi, '_').slice(0, 80);
}

function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`upload:${ip}`, 30, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Muitos uploads. Tente novamente mais tarde.' },
        { status: 429 },
      );
    }

    const auth = await resolveAuthEmail(request);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawType = String(formData.get('type') || 'documents').toLowerCase().trim();
    // Opcional: cadastro pode enviar e-mail para amarrar o path (sem quebrar quem não envia).
    const claimedEmail = String(formData.get('ownerEmail') || formData.get('email') || '')
      .toLowerCase()
      .trim();

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!ALLOWED_UPLOAD_TYPES.has(rawType)) {
      return NextResponse.json({ error: 'Tipo de pasta de upload inválido' }, { status: 400 });
    }

    if (!auth) {
      if (AUTH_REQUIRED_UPLOAD_TYPES.has(rawType) || !ANON_ALLOWED_UPLOAD_TYPES.has(rawType)) {
        return NextResponse.json(
          { error: 'Faça login para enviar este tipo de arquivo.' },
          { status: 401 },
        );
      }
      if (!(await enforceApiRateLimit(`upload-anon:${ip}`, 8, 60 * 60 * 1000))) {
        return NextResponse.json(
          { error: 'Muitos uploads anônimos. Faça login ou aguarde.' },
          { status: 429 },
        );
      }
    }

    let mime = file.type;
    if (rawType === "curriculos" && (!mime || mime === "application/octet-stream" || mime === "binary/octet-stream")) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) mime = "application/pdf";
      else if (name.endsWith(".docx")) mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (name.endsWith(".doc")) mime = "application/msword";
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
    }

    const maxSize = auth ? MAX_FILE_SIZE_AUTH : MAX_FILE_SIZE_ANON;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: auth ? 'Arquivo muito grande (máx. 10MB)' : 'Arquivo muito grande (máx. 5MB sem login)' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikeAllowedFile(buffer, mime)) {
      return NextResponse.json(
        { error: 'Conteúdo do arquivo não corresponde ao tipo informado' },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 120);

    const ownerPrefix = auth?.email
      ? sanitizeOwnerPrefix(auth.email)
      : isPlausibleEmail(claimedEmail)
        ? sanitizeOwnerPrefix(claimedEmail)
        : 'anon';
    const filePath = `${rawType}/${ownerPrefix}/${timestamp}_${sanitizedFileName}`;

    const uploaded = await uploadPrivateFile(filePath, buffer, mime);
    const url = uploaded.signedUrl || uploaded.publicUrl;
    if (!url) {
      return NextResponse.json({ error: 'Erro ao gerar URL do arquivo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: {
        name: sanitizedFileName,
        size: file.size,
        url,
        path: uploaded.path,
        signed: Boolean(uploaded.signedUrl),
        type: mime,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
