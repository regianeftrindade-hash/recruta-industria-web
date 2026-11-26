# Auditoria LGPD — fechamento técnico (pós-#66)

Data: 23/11/2026 (America/Sao_Paulo). Escopo: `main` com PR #66 publicado + melhorias do PR #67.  
**Não é parecer jurídico. Não declara conformidade legal.**

---

## Corrigido (técnico)

| Item | Onde | Evidência |
|------|------|-----------|
| Banner de cookies + opt-in marketing | #66 | `CookieConsentBanner`, `ri_cookie_consent` |
| Google Ads script só com marketing | #66 | `GoogleAdsLoader` |
| Conversões gtag sem opt-in (stub dataLayer) | **#67** | `lib/analytics/google-ads.ts` exige consentimento |
| Senha fora do `localStorage` | #66 | cadastro rápido |
| Aceite Termos/Privacidade (rápido/empresa) | #66 | checkboxes |
| Exclusão: campos avatar/currículo/atestado/vídeo | #66 | `delete-own-account` |
| Exclusão: paths em `formDataJSON` + pastas upload/vídeo | **#67** | `collectStoragePathsFromUnknown`, `removePrivateFilesByPrefixes` |
| Logs de lock sem e-mail completo | **#67** | `security-audit.ts` redige e-mail |
| Texto de privacidade alinhado (cookies, exclusão, sensíveis) | #66+#67 | `privacidade.pt-BR.ts` |

---

## Pendente técnico (sem decisão jurídica)

| Item | Notas |
|------|-------|
| Listagem Storage limitada a 1000 arquivos/pasta | Prefixo pode deixar restos se houver >1000 objetos |
| Anexos só referenciados fora do padrão de path | Podem não ser detectados pelo coletor |
| Upstash opcional | Rate-limit em memória é frágil em multi-instância |
| Inventário automatizado de cookies de terceiros em runtime | Depende de opt-in + ferramentas de medição |
| Mascaramento Art. 11 na API empresa | Requer decisão de produto (não alterado) |

---

## Depende da empresa

1. CNPJ e endereço da controladora (forma já informada: **Empresário Individual / ME** — ver `docs/lgpd-dispensa-encarregado-anpd-2-2022.md`)  
2. Confirmar região do projeto Supabase e DPAs (Vercel, Stripe, Asaas, Hostinger, Google, Upstash, Sentry)  
3. Decidir se Google Ads permanece (opt-in) ou é desligado  
4. Decidir retenção de `PaymentRecord` / logs após exclusão (hoje **não** apagamos automaticamente)  
5. Decidir manter, minimizar ou restringir campos sensíveis do cadastro completo  
6. Canal de titulares: **`contato@recrutaindustria.com`** (mantido; dispensa de encarregado art. 11 Res. CD/ANPD nº 2/2022)  
7. Confirmar se backups (Vercel/Supabase) têm processo de purge sob pedido  
8. Manter autoavaliação das exclusões do art. 3º da Res. CD/ANPD nº 2/2022 (alto risco / receita / grupo)

---

## Depende de advogado

1. ~~Obrigação de indicar DPO~~ — dispensa operacional registrada para agente de pequeno porte (ME/EI); validar periodicamente art. 3º/4º  
2. Tabela de retenção por categoria de dado  
3. Bases Art. 11 LGPD / consentimento específico para dados sensíveis  
4. Lista formal de subprocessadores e mecanismos de transferência internacional  
5. Política de cookies detalhada (inventário + prazos)  
6. Revisão do banner e dos textos `/termos/uso` e `/termos/privacidade` (incl. dados societários quando fornecidos)  
7. Foro, lei aplicável, SLA/reembolso se forem cláusulas contratuais  
8. Avaliação GDPR / leis dos países atendidos  
9. **Não declarar conformidade** até parecer especializado 

---

## Mapa — exclusão de conta

| Ativo | Tratamento atual |
|-------|------------------|
| User / Profile / Professional / Company | Apagados |
| Equipe / shares / feedback | Apagados (best-effort SQL) |
| Arquivos Storage (campos + JSON + pastas) | Remoção best-effort |
| `PaymentRecord` | **Retido** (não excluir automaticamente) |
| `SecurityAuditLog` / audit memory | Podem permanecer |
| Backups de infra | Fora do app — processo operacional |

## Mapa — dados sensíveis (Art. 11)

Coletados no cadastro completo / `Profile` se preenchidos: orientação sexual, religião, identidade de gênero, sexo biológico, antecedentes (+ `atestadoURL`).  
Compartilhamento: API de perfil empresa / export pode incluir atestado e campos do `formDataJSON` quando há desbloqueio.  
**Nenhuma remoção de campo neste PR** (aguarda decisão empresarial).

## Subprocessadores (código)

| Serviço | Uso | Doc. contratual |
|---------|-----|-----------------|
| Vercel | Hosting | Pendente empresa |
| Supabase | DB + Storage | Pendente região/DPA |
| Stripe | Pagamentos intl | Pendente DPA |
| Asaas | Pagamentos BR | Pendente |
| Hostinger | SMTP | Pendente |
| Google | OAuth + Ads (opt-in) | Pendente |
| Upstash | Rate-limit (se configurado) | Pendente |
| Sentry | Erros (se ativo) | Pendente |
| WhatsApp | Off por padrão | — |
| Datagma | Ingestão parceira | Pendente |

## Divergências texto × sistema (após #67)

| Tema | Status |
|------|--------|
| Cookies marketing com consentimento | Alinhado |
| Exclusão de conta na UI | Alinhado (mencionado) |
| Campos sensíveis | Mencionado; salvaguardas Art. 11 ainda jurídicas |
| Retenção numérica | Ainda pendente (não inventada) |
| Controladora | EI / ME informado; CNPJ/endereço ainda ausentes (não inventados) |
| Encarregado | Dispensa art. 11 Res. CD/ANPD nº 2/2022 registrada; canal `contato@` |

---

## Decisões que dependem de você (objetivas)

1. Fornecer CNPJ + endereço para publicação nos termos (quando autorizar alteração jurídica)  
2. Prazos de retenção desejados  
3. Destino de `PaymentRecord` pós-exclusão  
4. Destino dos campos sensíveis  
5. Manter ou desligar Google Ads  
6. Confirmar DPAs/regiões dos subprocessadores  
7. Encaminhar textos a advogado para validação final  
8. Revalidar autoavaliação de alto risco (art. 4º da Res. CD/ANPD nº 2/2022) 
