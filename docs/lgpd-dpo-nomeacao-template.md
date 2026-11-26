# Template — nomeação do Encarregado (DPO)

**Status:** rascunho operacional para preenchimento humano.  
**Não é ato de nomeação.** Não inventa nome, e-mail, CPF/CNPJ nem assinatura.

**Base:** LGPD art. 41 (encarregado). Validar texto final com advogado antes de publicar.

---

## 1. Dados da controladora (preencher só com dados reais)

| Campo | Valor | Quem preenche | Status |
|-------|-------|---------------|--------|
| Razão social | _a definir_ | Controladora | Pendente |
| Nome fantasia | Recruta Indústria | — | OK (marca do produto) |
| CNPJ | _a definir_ | Controladora | Pendente |
| Endereço completo | _a definir_ | Controladora | Pendente |
| País / UF | Brasil / _UF_ | Controladora | Pendente |
| Representante legal | _a definir_ | Controladora | Pendente |

---

## 2. Encarregado / DPO (preencher só com pessoa/empresa real)

| Campo | Valor | Quem preenche | Status |
|-------|-------|---------------|--------|
| Tipo | [ ] Pessoa física [ ] Pessoa jurídica (terceirizado) | Controladora + advogado | Pendente |
| Nome completo / razão social | _a definir_ | Controladora | Pendente |
| CPF / CNPJ | _a definir_ | Controladora | Pendente (sigilo interno) |
| E-mail público de titulares | _a definir_ (hoje operacional: `contato@recrutaindustria.com`) | Controladora | Pendente canal exclusivo |
| Telefone (opcional) | _a definir_ | Controladora | Pendente |
| Data de início da nomeação | _a definir_ | Controladora | Pendente |
| Escopo (BR / intl) | _a definir_ | Advogado | Pendente |

---

## 3. O que exige decisão / assinatura / validação de advogado

| Item | Tipo | Responsável | Bloqueia publicação em `/termos/*`? |
|------|------|-------------|-------------------------------------|
| Escolher DPO interno vs terceirizado | Decisão empresarial | Controladora | Sim |
| Contrato com DPO terceirizado (se houver) | Assinatura | Controladora + DPO | Sim (se terceirizado) |
| Texto de nomeação / ata / procuração | Validação jurídica | Advogado | Sim |
| Publicar identidade/contato do DPO nos termos | Autorização de conteúdo jurídico | Controladora + advogado | Sim |
| Canal exclusivo `dpo@…` vs manter `contato@…` | Decisão operacional | Controladora | Recomendado |
| Atualizar política de privacidade / LGPD no site | Autorização explícita de UI/conteúdo | Usuário + advogado | Sim |

---

## 4. Checklist técnico (código) — sem inventar dados

- [x] Canal operacional de titulares documentado (`contato@recrutaindustria.com`) em `docs/lgpd-pendencias-operacionais.md`
- [x] `security.txt` técnico (vulnerabilidades) ≠ canal DPO
- [ ] Substituir placeholders nos termos **somente** após preenchimento real + autorização
- [ ] Não versionar CPF/dados sensíveis do DPO em repositório público

## 5. Referências internas

- `docs/lgpd-pendencias-operacionais.md`
- `docs/lgpd-dpa-fornecedores-checklist.md`
- `docs/politica-retencao-template.md`
- `docs/conformidade-lgpd-auditoria-final.md`
