import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'documents';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx. 10MB)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const timestamp = Date.now();

    const sanitizedFileName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );

    const filePath = `${type}/${timestamp}_${sanitizedFileName}`;
const supabase = getSupabase();

    const { error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        url: data.publicUrl,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);

    return NextResponse.json(
      {
        error: 'Erro ao fazer upload do arquivo',
        details: String(error)
      },
      {
        status: 500
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}