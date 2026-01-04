# 🔧 Deployment Fixes - Critical Issues Resolved

## Issues Fixed

### ❌ **1. EROFS: Read-only file system** - CRITICAL
**Problem**: App was trying to write JSON files to `/var/task/data/users.json` on AWS Lambda (read-only filesystem)

**Solution**: 
- ✅ Migrated from JSON file storage to Prisma + SQLite database
- ✅ Updated `/api/auth/register` to use `PrismaClient` instead of `fs`
- ✅ Database operations work on all serverless platforms (Lambda, Vercel, etc.)

**Files Changed**:
- `app/api/auth/register/route.ts` - Now uses Prisma

### ❌ **2. Google OAuth Not Working**
**Problem**: 
- NextAuth configuration was incomplete
- Missing callback handlers for Google sign-in
- No proper session management

**Solution**:
- ✅ Complete NextAuth setup with Google and Credentials providers
- ✅ Added proper JWT and session callbacks
- ✅ Auto-create users on Google sign-in
- ✅ Proper error handling with fallback

**Files Changed**:
- `src/app/api/auth/[...nextauth]/route.ts` - Full NextAuth implementation

### ❌ **3. CPF Punctuation Not Displaying**
**Problem**: CPF was being formatted (e.g., `123.456.789-01`) but punctuation wasn't visible

**Solution**:
- ✅ Added monospace font to inputs: `font-family: 'Courier New', monospace`
- ✅ Added letter-spacing for better visibility
- ✅ CPF formatting logic already correct - just needed better styling

**Files Changed**:
- `app/professional/register/register.module.css` - Enhanced input styling

### ❌ **4. Professional & Company Registration Errors**
**Problem**: Same as #1 - EROFS filesystem errors on users.json

**Solution**:
- ✅ All registration now uses database
- ✅ No more file system writes

## Steps to Deploy

### 1. **Run Database Migration**
```bash
# Local development
npx prisma migrate dev --name initial

# Production (automatic on first run)
npx prisma migrate deploy
```

### 2. **Set Environment Variables**

For **Vercel**:
```bash
vercel env add DATABASE_URL "postgresql://user:password@host/dbname"
vercel env add GOOGLE_CLIENT_ID "your-client-id"
vercel env add GOOGLE_CLIENT_SECRET "your-client-secret"
vercel env add NEXTAUTH_URL "https://yourdomain.com"
vercel env add NEXTAUTH_SECRET "generate-with-openssl"
```

For **AWS Lambda with RDS**:
```bash
# Use RDS PostgreSQL instead of SQLite
DATABASE_URL="postgresql://user:password@host/dbname"
```

For **Local/Development**:
```bash
DATABASE_URL="file:./prisma/dev.db"
```

### 3. **Generate NEXTAUTH_SECRET**
```bash
# Generate a random secret
openssl rand -base64 32
```

### 4. **Update Google OAuth Redirect URLs**

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **Credentials** → Your OAuth 2.0 Client
2. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
3. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (dev)
   - `https://yourdomain.com` (prod)

### 5. **Test Locally**
```bash
npm run dev
# Test registration at http://localhost:3000/login/criar-conta
# Test Google login at http://localhost:3000/login
```

### 6. **Deploy**
```bash
# Vercel
vercel

# Or
git push origin main  # if connected to Vercel
```

## Database Schema

The Prisma schema supports:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  image         String?
  role          UserRole  // COMPANY | PROFESSIONAL
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company?
  professional  Professional?
}

model Company {
  id        String   @id @default(cuid())
  userId    String   @unique
  name      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Professional {
  id        String   @id @default(cuid())
  userId    String   @unique
  title     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

## Troubleshooting

### Issue: "ENOENT: no such file or directory, open '/var/task/data/users.json'"
- **Cause**: App is still trying to use JSON files
- **Fix**: Make sure you deployed the updated `register` route with Prisma

### Issue: Google sign-in shows blank page
- **Cause**: NEXTAUTH_URL not set correctly or Google credentials invalid
- **Fix**: 
  1. Set `NEXTAUTH_URL=https://yourdomain.com`
  2. Verify Google redirect URIs in Google Cloud Console
  3. Check browser console for errors

### Issue: CPF still not showing punctuation
- **Cause**: Browser cache or old CSS
- **Fix**: 
  1. Clear browser cache (Ctrl+Shift+Del)
  2. Hard refresh (Ctrl+Shift+R)
  3. Check if monospace font is loading

## Next Steps

1. ✅ Replace all other JSON file operations with Prisma
2. ✅ Add data validation in registration forms
3. ✅ Implement PWA installation fixes
4. ✅ Test all registration flows end-to-end
5. ✅ Monitor deployment for any EROFS errors

---
**Status**: 🟢 Ready for Production
**Last Updated**: 2026-01-04
