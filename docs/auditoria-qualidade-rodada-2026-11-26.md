# Relatório — rodada de qualidade (26/11/2026, America/São Paulo)

**Branch/PR:** `cursor/melhorias-qualidade-10-06b8`  
**Escopo:** LGPD (docs), a11y axe WCAG 2.2 AA, Sentry 11, SEO técnico.  
**Restrições cumpridas:** sem merge/deploy; sem migração Postgres; sem alterar Stripe LIVE / Asaas / planos / Premium oculto / Upstash / PWA / 12 idiomas-RTL; sem inventar DPO/assinaturas/conteúdo comercial.

**Nota técnica estimada (código + ops observável):** **9,2 / 10**  
Não é 10: faltam nomeação real do DPO, DPAs assinados, validação jurídica da retenção, conteúdo institucional real + Search Console humano, e revisão manual de teclado/leitor de tela além do axe.

---

## 1. Concluído tecnicamente

### LGPD (documentação — sem inventar dados)
| Entrega | Arquivo |
|---------|---------|
| Template de nomeação DPO + o que exige advogado/assinatura | `docs/lgpd-dpo-nomeacao-template.md` |
| Checklist DPAs por fornecedor (status Pendente) | `docs/lgpd-dpa-fornecedores-checklist.md` |
| Retenção (já existia; referenciada) | `docs/politica-retencao-template.md` |
| Índice operacional atualizado | `docs/lgpd-pendencias-operacionais.md` |

### Acessibilidade
| Item | Resultado |
|------|-----------|
| axe tags | Incluído `wcag22aa` em `e2e/a11y-axe.spec.ts` |
| Produção (antes do fix) | Home/login: `target-size` no botão “Mostrar senha” (22×22) |
| Dashboards / cadastros / vagas | Sem serious/critical no axe (Production + local) |
| Correção mínima | `app/page.tsx`: alvo do olho da senha **24×24** (CSS já tinha 24px no module; override inline forçava 22) |
| Revalidação local | **7/7** specs axe passed contra `127.0.0.1:3000` |

### Sentry 11
| Item | Detalhe |
|------|---------|
| Pacote | `@sentry/nextjs` **10.78.0 → 11.19.0** |
| Privacidade | `dataCollection` restritiva explícita (equiv. `sendDefaultPii: false` do v10) + `beforeSend` scrub |
| Superfície | Sem `withSentryConfig` / `tunnelRoute` — breaking menor |
| Audit | `npm audit` → **0 vulnerabilities** |
| Testes | `sentry-options` + `sentry-privacy` OK |

### SEO / marca (técnico)
| Item | Detalhe |
|------|---------|
| Helper único hreflang | `lib/seo/language-alternates.ts` (12 locales + x-default) |
| Layout + sitemap + vagas + termos | Usam o helper; canonical em `/vagas` |
| robots / noindex | Disallow ampliado (login/auth/pagamento/dashboards); noindex em layouts privados |
| Sitemap | Removidos `/login` e `?tipo=*` |
| Job OG | Imagem de marca em `/vagas/[id]` |
| Playbook Search Console | `docs/seo-search-console-playbook.md` (passos humanos) |

### Testes locais desta rodada
- `tsc --noEmit` OK  
- `eslint .` OK  
- `vitest run` → **581 passed** (3 skipped)  
- axe E2E local → **7 passed**  
- `npm audit` → 0  

---

## 2. Depende de providência humana / jurídica

| Tema | O que falta | Quem |
|------|-------------|------|
| DPO | Preencher nome/contato reais; ato de nomeação; publicar em `/termos/*` | Controladora + advogado + autorização de conteúdo |
| DPAs | Assinar/arquivar Vercel, DB, Asaas, Stripe, Sentry, Upstash, etc. | Controladora + advogado |
| Retenção | Preencher prazos e bases legais na tabela | Advogado |
| Search Console | Verificar domínio, enviar sitemap, monitorar | Operação |
| Conteúdo SEO | Sobre/institucional, cases reais autorizados | Marketing (sem filler) |
| A11y humana | Teclado + leitor de tela além do axe; contraste light/dark formal | QA / design |
| Deploy | Merge + Production publish **somente com autorização** | Você |
| `/login` → `/` | Em Production `/login` redireciona para home (axe “login” = mesma superfície) | Confirmar se intencional (fora desta rodada) |

---

## 3. Riscos

| Risco | Mitigação |
|-------|-----------|
| Sentry 11 coleta mais por default | `dataCollection` restritiva + scrub; monitorar eventos pós-deploy |
| Engines `node: 24.x` vs runtime agente 22 | Vercel/CI devem usar Node alinhado; Sentry 11 exige ≥20.19 |
| Fix a11y só na home (inline) | Login dedicado usa checkbox “mostrar senha”; `/login` atual redireciona à home |
| Importações de vagas anteriores | Não tocadas nesta rodada; usuário citou “1.096” como baseline a preservar funcionalmente — não houve DELETE/migrate |

---

## 4. Nota por eixo (estimativa)

| Eixo | Antes (~) | Agora (~) | Teto sem humanos |
|------|-----------|-----------|------------------|
| Segurança / deps | 8,7 | **9,3** (Sentry 11 + audit 0) | ~9,5 |
| LGPD | 7,5 docs / 4 ops jurídica | **8,0 docs** / ops jurídica igual | 10 só com DPO+DPAs |
| A11y | 8,0 | **9,0** (axe críticos ok nas rotas medidas) | 9,5+ com QA humana |
| SEO técnico | 8,5 | **9,0** | 9,5+ com GSC + conteúdo real |
| **Global técnico** | ~8,9 | **~9,2** | **≠ 10** sem jurídicos/conteúdo |

---

## 5. Próximos passos sugeridos (após sua autorização)

1. Revisar e mergear este PR.  
2. Deploy Production (Sentry 11 + a11y eye 24px + SEO helper).  
3. Advogado: DPO + DPAs + prazos de retenção.  
4. Operação: Search Console + sitemap.  
5. Opcional: auditoria axe mobile + contraste formal.
