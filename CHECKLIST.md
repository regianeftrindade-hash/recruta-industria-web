# ✅ CHECKLIST DE AÇÕES - Recruta Indústria

## STATUS GERAL

- [x] Análise completa concluída
- [x] Erros críticos corrigidos
- [x] Documentação criada
- [ ] Limpeza de arquivos obsoletos
- [ ] Node.js v20 instalado
- [ ] npm run dev funcionando
- [ ] Vagas implementadas
- [ ] Candidaturas implementadas
- [ ] Sistema de emails funcionando
- [ ] Testes automatizados
- [ ] Deploy em staging
- [ ] Deploy em produção

---

## 🧹 FASE 1: LIMPEZA (Próximas 2 horas)

### Remover Arquivos Obsoletos
- [ ] Deletar `app/login/page_old.tsx`
- [ ] Deletar `app/login/criar-conta-v2/` (pasta completa)
- [ ] Deletar `scripts/e2e_node.js`
- [ ] Deletar `scripts/test_auth.js`
- [ ] Deletar `scripts/unblock-ip.js`
- [ ] Executar: `git add .`
- [ ] Executar: `git commit -m "chore: remover arquivos obsoletos"`

### Remover Dependências Desnecessárias
- [ ] `npm remove jsbarcode`
- [ ] `npm remove qrcode`
- [ ] `npm remove sql.js`
- [ ] `npm remove install`
- [ ] Verificar `package.json` - deve restar 13 dependências
- [ ] Executar: `git add package.json package-lock.json`
- [ ] Executar: `git commit -m "chore: remover deps desnecessárias"`

### Remover Documentação Obsoleta
- [ ] Deletar `EROFS_FIX.md`
- [ ] Deletar `MIGRATION_NEXT_STEPS.md`
- [ ] Deletar `QUICK_FIXES_APPLIED.md`
- [ ] Deletar `CORRECAO_COMPLETA.md`
- [ ] Deletar `QUICK_START_LAUNCH.md`
- [ ] Deletar `GOOGLE_FIX.md`
- [ ] Deletar `GOOGLE_OAUTH_DEBUG.md`
- [ ] Deletar `GOOGLE_AUTH_SETUP.md`

### Setup Local
- [ ] Atualizar Node.js para v20+ (nvm install 20.18.0)
- [ ] Ativar Node 20 (nvm use 20.18.0)
- [ ] Verificar: `node --version` deve ser v20.x.x
- [ ] Executar: `npm install` (com Node v20)
- [ ] Verificar dependências: `npm ls` (sem warnings)

### Testar Funcionamento
- [ ] Executar: `npm run dev`
- [ ] Abrir: `http://localhost:3000`
- [ ] Testar página inicial (deve carregar)
- [ ] Testar login com Google (deveria redirecionar)
- [ ] Testar registro (deve exibir formulário)

---

## 🗄️ FASE 2: BANCO DE DADOS (Próximas 4 horas)

### Verificar Prisma
- [ ] Executar: `npx prisma studio`
- [ ] Verificar models existentes:
  - [ ] User
  - [ ] Company
  - [ ] Professional
  - [ ] EmailVerification
  - [ ] PaymentRecord
- [ ] Fechar Prisma Studio (Ctrl+C)

### Executar Migrations Pendentes
- [ ] Executar: `npx prisma migrate status`
- [ ] Se houver pending: `npx prisma migrate dev --name pending`
- [ ] Verificar migrations: `cat prisma/migrations/*/migration.sql`
- [ ] Executar: `npx prisma generate`

### Verificar Tipos Prisma
- [ ] Deletar: `node_modules/.prisma` (cache)
- [ ] Executar: `npx prisma generate`
- [ ] Executar: `npx tsc --noEmit` (verificar erros)

---

## 🎯 FASE 3: IMPLEMENTAÇÃO DE VAGAS (Próximas 10 horas)

### 1. Schema Prisma (1 hora)

```prisma
# Adicionar ao prisma/schema.prisma

model Job {
  id            String   @id @default(cuid())
  title         String
  description   String   @db.Text
  location      String
  salary        Float?
  salaryMax     Float?
  industry      String
  company       Company  @relation(fields: [companyId], references: [id])
  companyId     String
  status        String   @default("OPEN")
  applications  Application[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@index([status])
}
```

- [ ] Adicionar model `Job` ao schema
- [ ] Atualizar `Company` model:
  ```prisma
  jobs       Job[]  # Adicionar esta linha
  ```
- [ ] Executar: `npx prisma db push`
- [ ] Verificar: `npx prisma studio`

### 2. API Routes (4 horas)

Criar arquivo `app/api/jobs/list/route.ts`:
- [ ] `GET /api/jobs/list` - Listar todas as vagas
- [ ] Filtrar por: location, industry, status
- [ ] Retornar: { success, data, error }
- [ ] Testar com Postman

Criar arquivo `app/api/jobs/[id]/route.ts`:
- [ ] `GET /api/jobs/[id]` - Detalhe de vaga
- [ ] Retornar vaga + company + applications count
- [ ] Testar com Postman

Criar arquivo `app/api/jobs/create/route.ts`:
- [ ] `POST /api/jobs/create` - Criar nova vaga
- [ ] Validar: title, description, location, company
- [ ] Verificar autenticação (companyId)
- [ ] Testar com Postman

### 3. Componentes React (3 horas)

Criar `app/components/JobCard.tsx`:
- [ ] Exibir: título, localização, salário
- [ ] Link para detalhes
- [ ] Styling consistente

Criar `app/components/JobList.tsx`:
- [ ] Listar múltiplas vagas
- [ ] Paginação/scroll infinito
- [ ] Filtros de busca

Criar `app/components/JobDetail.tsx`:
- [ ] Exibir detalhes completos
- [ ] Botão "Se candidatar"
- [ ] Mostrar empresa

### 4. Integração nos Dashboards (2 horas)

Company Dashboard:
- [ ] [ ] Adicionar seção "Minhas Vagas"
- [ ] [ ] Botão "Criar Nova Vaga"
- [ ] [ ] Listar vagas criadas
- [ ] [ ] Link para editar/deletar

Professional Dashboard:
- [ ] Adicionar seção "Vagas Disponíveis"
- [ ] Filtros de busca
- [ ] Listar 10 vagas por padrão
- [ ] Link para detalhes

### 5. Testes (2 horas)

- [ ] Criar `app/api/jobs/__tests__/list.test.ts`
- [ ] Criar `app/components/__tests__/JobCard.test.tsx`
- [ ] Executar: `npm test`
- [ ] Cobertura mínima: 70%

---

## 🎫 FASE 4: IMPLEMENTAÇÃO DE CANDIDATURAS (Próximas 12 horas)

### 1. Schema Prisma (1 hora)

```prisma
model Application {
  id            String   @id @default(cuid())
  job           Job      @relation(fields: [jobId], references: [id])
  jobId         String
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  status        String   @default("PENDING")
  coverLetter   String?  @db.Text
  appliedAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([jobId, userId])
  @@index([userId])
  @@index([jobId])
  @@index([status])
}
```

- [ ] Adicionar model `Application`
- [ ] Atualizar `User`: `applications Application[]`
- [ ] Atualizar `Job`: `applications Application[]`
- [ ] Executar: `npx prisma db push`

### 2. API Routes (4 horas)

- [ ] `POST /api/applications/apply` - Aplicar a vaga
  - Validar: jobId, userId
  - Verificar duplicata
  - Retornar success/error

- [ ] `GET /api/applications/list` - Listar candidaturas
  - Do usuário (professional)
  - Para empresa (company)
  - Filtrar por status

- [ ] `PATCH /api/applications/[id]` - Atualizar status
  - Rejeitar/Aceitar candidatura
  - Apenas company pode fazer

### 3. Componentes React (3 horas)

- [ ] `ApplyModal.tsx` - Modal para se candidatar
- [ ] `MyApplications.tsx` - Listar candidaturas do profissional
- [ ] `ApplicationsList.tsx` - Listar candidatos (company)
- [ ] `ApplicationStatus.tsx` - Status com cor/ícone

### 4. Integração (3 horas)

- [ ] JobDetail: Botão "Se candidatar" → Modal
- [ ] Professional Dashboard: Aba "Minhas Candidaturas"
- [ ] Company Dashboard: Aba "Candidatos"
- [ ] Notificações básicas

### 5. Testes (1 hora)

- [ ] Testes de apply com duplicata
- [ ] Testes de status update
- [ ] Testes de listagem por tipo

---

## 📧 FASE 5: SISTEMA DE EMAILS (Próximas 8 horas)

### Instalação
- [ ] `npm install nodemailer @types/nodemailer`
- [ ] `npm install dotenv` (se não tiver)

### Configuração
- [ ] Criar `lib/email.ts` com funções:
  - [ ] `sendVerificationEmail(email, code)`
  - [ ] `sendPasswordResetEmail(email, token)`
  - [ ] `sendApplicationConfirmation(email, jobTitle)`
  - [ ] `sendApplicationUpdate(email, status)`

### Endpoints
- [ ] Implementar `/api/auth/send-verification-code` (real)
- [ ] Implementar `/api/auth/verify-email` (com código)
- [ ] Implementar `/api/auth/request-password-reset`
- [ ] Implementar `/api/auth/reset-password`

### Testes
- [ ] Usar Mailtrap.io para testes
- [ ] Testar cada endpoint
- [ ] Verificar templates de email

---

## 🧪 FASE 6: TESTES AUTOMATIZADOS (Próximas 6 horas)

### Setup Jest
- [ ] `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`
- [ ] Criar `jest.config.js`
- [ ] Criar `jest.setup.js`

### Testes Unitários
- [ ] `lib/security.ts` - validações
- [ ] `lib/users.ts` - CRUD operations
- [ ] `lib/email.ts` - formatação

### Testes de Componentes
- [ ] `JobCard.tsx`
- [ ] `JobList.tsx`
- [ ] `ApplyModal.tsx`

### Testes de API
- [ ] `/api/jobs/list`
- [ ] `/api/applications/apply`
- [ ] `/api/auth/register`

### Coverage
- [ ] Executar: `npm test -- --coverage`
- [ ] Meta: >70% de cobertura
- [ ] CI/CD: GitHub Actions com testes

---

## 🚀 FASE 7: OTIMIZAÇÕES (Próximas 6 horas)

### Performance
- [ ] [ ] Implementar React.memo em componentes
- [ ] [ ] Adicionar lazy loading para imagens
- [ ] [ ] Cache de queries com React Query
- [ ] [ ] Code splitting automático Next.js

### Mobile Responsividade
- [ ] [ ] Testar em dispositivos móveis
- [ ] [ ] Ajustar CSS inline para media queries
- [ ] [ ] Implementar mobile menu
- [ ] [ ] Testar touch interactions

### SEO
- [ ] [ ] Adicionar meta tags
- [ ] [ ] Implementar sitemap
- [ ] [ ] Robots.txt
- [ ] [ ] Open Graph tags

---

## 🚢 FASE 8: DEPLOYMENT (Próximas 4 horas)

### Preparação
- [ ] [ ] Verificar `.env.production`
- [ ] [ ] Testar build: `npm run build`
- [ ] [ ] Verificar build time
- [ ] [ ] Verificar bundle size: `npm run analyze` (se tiver)

### Deploy Vercel
- [ ] [ ] Conectar repositório GitHub
- [ ] [ ] Configurar environment variables
- [ ] [ ] Deploy automático em push
- [ ] [ ] Testar em produção

### Verificações
- [ ] [ ] Acessar domínio de produção
- [ ] [ ] Testar fluxo completo:
  - [ ] Registro
  - [ ] Login
  - [ ] Criar vaga
  - [ ] Se candidatar
  - [ ] Receber email
- [ ] [ ] Verificar logs de erro
- [ ] [ ] Monitoring ativo

---

## 📊 PROGRESSO GERAL

```
Limpeza:              [████░░░░░░░░░░░░░░░░░░░░]  14%
DB + Vagas:           [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
Candidaturas:         [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
Emails:               [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
Testes:               [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
Otimizações:          [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
Deploy:               [░░░░░░░░░░░░░░░░░░░░░░░░░]   0%

TOTAL:                [████░░░░░░░░░░░░░░░░░░░░]   6%

Meta: 100% completo até fim de janeiro
```

---

## 📝 NOTAS IMPORTANTES

```
1. Sempre commitar após cada seção concluída
2. Testar localmente antes de dar próximo passo
3. Usar Prisma Studio regularmente (npx prisma studio)
4. Documentar decisões técnicas
5. Code review antes de merge
6. Backup do DB antes de migrations grandes
7. Manter arquivo .env seguro
```

---

## 🎯 OBJETIVO FINAL

Ao completar este checklist, o projeto terá:

- ✅ Autenticação funcionando
- ✅ Vagas de emprego
- ✅ Sistema de candidaturas
- ✅ Notificações por email
- ✅ Testes automatizados
- ✅ Otimizações de performance
- ✅ Pronto para produção

**Tempo total estimado: 50-70 horas**

---

**Última atualização:** 04/01/2026  
**Próxima revisão:** Após completar Fase 2

