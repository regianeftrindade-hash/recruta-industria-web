# Template — política de retenção de dados (rascunho técnico)

**Status:** rascunho para validação jurídica humana.  
**Não é política oficial.** Não inventa prazos legais.

Preencher a coluna “Prazo aprovado” com advogado + controladora.

| Categoria | Exemplos no sistema | Tratamento atual no código | Prazo aprovado (empresa) | Base legal (advogado) |
|-----------|---------------------|----------------------------|--------------------------|------------------------|
| Conta / perfil | User, Professional, Company | Apagados na exclusão de conta | _a definir_ | _a definir_ |
| Documentos privados | currículo, atestado, CNH | Remoção best-effort no Storage (paginada) | _a definir_ | _a definir_ |
| Pagamentos | PaymentRecord | **Retido** após exclusão de conta | _a definir_ (obrig. fiscal?) | _a definir_ |
| Auditoria segurança | SecurityAuditLog | Pode permanecer | _a definir_ | _a definir_ |
| Cookies marketing | `ri_cookie_consent` | 180 dias no browser | _a definir_ | Consentimento |
| Sessão / auth | NextAuth cookies | Ciclo de sessão | _a definir_ | Legítimo interesse / contrato |
| Backups infra | Vercel / Supabase | Fora do app | Processo de purge _a definir_ | _a definir_ |
| Dados Art. 11 | campos sensíveis opcionais | Coleta se preenchidos | Decidir minimizar | Consentimento específico |

## Procedimento sugerido (operacional)

1. Titular solicita via `contato@recrutaindustria.com` (canal da dispensa de encarregado — art. 11 Res. CD/ANPD nº 2/2022).  
2. Verificar identidade do solicitante.  
3. Classificar pedido (acesso, correção, exclusão, portabilidade, oposição).  
4. Executar fluxo de produto quando disponível (ex.: exclusão de conta).  
5. Registrar atendimento e prazo de resposta.  
6. Se envolver PaymentRecord/backups, seguir retenção aprovada — **não apagar sem base**.

Controladora (EI/ME), dispensa de encarregado e DPAs: ver `docs/lgpd-pendencias-operacionais.md` e `docs/lgpd-dispensa-encarregado-anpd-2-2022.md`.
