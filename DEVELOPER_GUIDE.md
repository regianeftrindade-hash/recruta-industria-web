# 🚀 Recruta Indústria - Developer Quick Start

## Project Status: ✅ BUILD COMPLETE & READY TO USE

This is a fully-built recruitment platform with authentication, user persistence, and dashboards. Everything compiles successfully and is ready for development.

---

## ⚡ Quick Start (5 Minutes)

### 1. Start the Development Server
```bash
cd c:\Projetos\recruta-industria\recruta-industria-web
npm run dev
```

Open browser: **http://localhost:3000**

### 2. Test Registration
1. Click "Criar Conta" or go to `/login/criar-conta`
2. Fill in:
   - Email: `test@example.com`
   - Password: `TestPass123` (minimum 8 chars)
   - Type: Professional or Company
   - Document: Any CPF/CNPJ
3. Click Register → User saved to `data/users.json`

### 3. Test Login
1. Go to `/login`
2. Enter email and password from registration
3. Click Login → Redirected to dashboard
4. See authenticated user info in dashboard

### 4. Check Data Persistence
```bash
cat data/users.json
```
You'll see the registered users with hashed passwords.

---

## 📁 Project Structure at a Glance

```
app/                 # UI Pages & API Routes
├── api/auth/       # Authentication endpoints
├── login/          # Login/Register pages  
├── professional/   # Professional dashboard
├── company/        # Company dashboard
└── layout.tsx      # Root layout + providers

lib/                 # Core Logic
├── users.ts        # User CRUD & data persistence
├── security.ts     # Validation & password hashing
└── payments.ts     # Payment utilities

data/
└── users.json      # User database (auto-created)

types/
└── next-auth.d.ts  # TypeScript definitions
```

---

## 🔑 Key Features Already Built

✅ **User Authentication**
- Email/Password registration & login
- Google OAuth ready (just add keys)
- Secure password hashing
- Session management with JWT

✅ **User Data**
- Persistent JSON storage
- User profiles (CPF/CNPJ, phone, etc.)
- Professional & Company roles
- Last login tracking

✅ **Dashboards**
- Professional dashboard (profile, jobs, applications)
- Company dashboard (jobs, candidates)
- Both require login to access

✅ **Security**
- Email validation
- CPF/CNPJ validation
- Password requirements
- Rate limiting
- XSS protection

✅ **API Routes**
- Authentication endpoints
- User registration
- Payment integration (PagBank, PagSeguro)

---

## 🛠️ Available Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Check TypeScript errors
npm run type-check

# Run linter
npm run lint
```

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (NEXTAUTH_SECRET, etc.) |
| `lib/users.ts` | User management system |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth configuration |
| `data/users.json` | User database (auto-created) |
| `types/next-auth.d.ts` | TypeScript types |

---

## 🔐 Environment Variables

All needed variables are in `.env.local`:

```dotenv
NEXTAUTH_SECRET=recruta-industria-super-secreto-2025
NEXTAUTH_URL=http://localhost:3000
PASSWORD_SALT=recruta-industria-salt-super-secreto
```

**Note**: Change these in production!

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/callback/credentials` - Login (NextAuth handles)
- `POST /api/auth/signin` - OAuth signin (Google)
- `POST /api/auth/callback/google` - Google OAuth callback

### Data (Auto-managed by NextAuth)
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - Get CSRF token

### Payments (Ready to use)
- `POST /api/pagseguro/create-payment` - Create PagSeguro payment
- `POST /api/pagbank/create-payment` - Create PagBank payment
- `POST /api/pagseguro/webhook` - Payment webhook
- `POST /api/pagbank/webhook` - Payment webhook

---

## 🧪 Testing the System

### Test Registration via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123",
    "userType": "professional"
  }'
```

### Test Home Page
```bash
curl http://localhost:3000
```

### View Registered Users
```bash
cat data/users.json
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Change `NEXTAUTH_SECRET` to a strong random value
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure Google OAuth credentials (if using)
- [ ] Migrate users.json to proper database (SQLite/PostgreSQL)
- [ ] Set up email service (SMTP) for notifications
- [ ] Run `npm run build` and test with `npm start`
- [ ] Set up monitoring and error logging
- [ ] Configure environment variables on hosting platform

---

## 💡 Development Tips

### View Next Build Info
```bash
npm run build
```
Shows all 23 routes and compilation time.

### Check for TypeScript Errors
```bash
npm run type-check
```

### Debug Authentication
Add `console.log()` in:
- `lib/users.ts` - User data operations
- `app/api/auth/[...nextauth]/route.ts` - Auth logic
- `app/login/page.tsx` - Login page

### View Session Data
In browser console:
```javascript
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

---

## 🔗 Important Links

- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth.js**: https://next-auth.js.org
- **Google OAuth Setup**: https://developers.google.com/identity
- **PagBank API**: https://pagbank.com/api
- **TypeScript**: https://www.typescriptlang.org

---

## ⚠️ Common Issues

**Q: Dev server won't start**
A: Kill existing Node process and clear `.next` folder:
```bash
taskkill /F /IM node.exe  # or pkill node
rm -r .next
npm run dev
```

**Q: Users not saving**
A: Make sure `data/` directory exists and you have write permissions. Check `.env.local` has PASSWORD_SALT.

**Q: Build fails with TypeScript errors**
A: Run `npm run type-check` to see all errors, then fix them.

**Q: Forgot login credentials**
A: Check `data/users.json` for registered emails, or delete the file to reset.

---

## 📚 What Was Already Done

This project was already built with:
- ✅ Complete Next.js setup
- ✅ NextAuth configuration  
- ✅ User persistence system
- ✅ Login/Register pages
- ✅ Dashboards for both user types
- ✅ Security validation
- ✅ Payment API routes
- ✅ TypeScript strict mode
- ✅ Production build

**You just need to**:
1. Test the current system
2. Add more features (job posting, applications, etc.)
3. Deploy when ready

---

## 🎯 Next Steps to Add Features

### 1. Job Posting
Create `/app/api/jobs/` routes to:
- Create job listings
- List jobs by company
- Search/filter jobs

### 2. Applications
Create `/app/api/applications/` routes to:
- Submit job applications
- List applications by user/company
- Update application status

### 3. Profile Completion
Add routes to save additional profile data:
- `/app/api/professional/profile`
- `/app/api/company/profile`

### 4. Email System
Set up `/app/api/auth/send-email` to send:
- Email verification
- Password reset links
- Job alerts
- Application notifications

### 5. Database Migration
When ready, replace JSON storage with:
- SQLite (simple)
- PostgreSQL (production)
- MongoDB (cloud)

---

## 💬 Questions?

The project structure is well-documented. Key files with comments:
- `lib/users.ts` - User management logic
- `app/api/auth/[...nextauth]/route.ts` - Auth configuration
- `types/next-auth.d.ts` - Type definitions

Start with `npm run dev` and explore the code!

---

**Ready to build? Start here:**
```bash
npm run dev
```

Visit: http://localhost:3000

Happy coding! 🎉
