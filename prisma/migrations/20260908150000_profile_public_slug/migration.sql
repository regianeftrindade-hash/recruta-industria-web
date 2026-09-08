-- Slug público legível para URLs de perfil (empresa)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_publicSlug_key" ON "Profile"("publicSlug");
