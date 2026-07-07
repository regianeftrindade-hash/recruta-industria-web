-- Vídeo de apresentação no perfil profissional
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "videoApresentacaoPath" TEXT;
