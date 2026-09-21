import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/auth/api-auth';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';
import { extractResumeText } from '@/lib/curriculum/extract-resume-text';
import { validateResumeUploadMeta } from '@/lib/curriculum/validate-resume-file';

export const runtime = 'nodejs';

/**
 * Upload temporário + extração de texto do currículo (cadastro ou edição).
 * Não persiste o arquivo nem o texto no banco (confirmação futura / IA).
 *
 * - Cadastro novo: pode ser anônimo (rate limit por IP mais restrito).
 * - Logado: só role PROFESSIONAL; empresa recebe 403.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`curriculum-extract:${ip}`, 20, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Muitas tentativas de importação. Aguarde e tente de novo.' },
        { status: 429 },
      );
    }

    const auth = await resolveAuthEmail(request);

    if (auth) {
      const user = await prisma.user.findUnique({
        where: { email: auth.email },
        select: { id: true, role: true },
      });

      if (!user || user.role !== 'PROFESSIONAL') {
        return NextResponse.json(
          { error: 'Apenas profissionais podem importar currículo.' },
          { status: 403 },
        );
      }

      if (!(await enforceApiRateLimit(`curriculum-extract-user:${user.id}`, 15, 60 * 60 * 1000))) {
        return NextResponse.json(
          { error: 'Limite de importações atingido. Tente mais tarde.' },
          { status: 429 },
        );
      }
    } else {
      // Cadastro ainda sem conta: limite mais baixo por IP
      if (!(await enforceApiRateLimit(`curriculum-extract-anon:${ip}`, 8, 60 * 60 * 1000))) {
        return NextResponse.json(
          { error: 'Limite de importações atingido. Tente mais tarde ou faça login.' },
          { status: 429 },
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Envie um arquivo de currículo.' }, { status: 400 });
    }

    const meta = validateResumeUploadMeta({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
    if (!meta.ok) {
      return NextResponse.json({ error: meta.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractResumeText({
      fileName: file.name,
      mimeType: meta.mime,
      size: file.size,
      buffer,
    });

    return NextResponse.json({
      success: true,
      extraction,
      nextStep: 'apply-patterns',
      persisted: false,
    });
  } catch (error) {
    console.error('Erro ao extrair currículo:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao processar o currículo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
