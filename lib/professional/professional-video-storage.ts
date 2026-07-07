import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extensionForVideoMime } from '@/lib/professional-video';

const BUCKET = 'uploads';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas');
  }
  return createClient(url, key);
}

export function buildProfessionalVideoPath(userId: string, mime: string): string {
  const ext = extensionForVideoMime(mime);
  return `professional-videos/${userId}/${Date.now()}_${randomUUID()}.${ext}`;
}

export function isProfessionalVideoPathOwned(path: string, userId: string): boolean {
  return path.startsWith(`professional-videos/${userId}/`);
}

export async function createProfessionalVideoUploadUrl(filePath: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw error || new Error('Erro ao preparar upload do vídeo');
  }

  return data;
}

export async function uploadProfessionalVideo(
  userId: string,
  buffer: Buffer,
  mime: string,
): Promise<string> {
  const filePath = buildProfessionalVideoPath(userId, mime);
  const supabase = getSupabase();

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (error) throw error;
  return filePath;
}

export async function deleteProfessionalVideo(path: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function downloadProfessionalVideo(path: string): Promise<Buffer> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw error || new Error('Vídeo não encontrado');
  }
  return Buffer.from(await data.arrayBuffer());
}
