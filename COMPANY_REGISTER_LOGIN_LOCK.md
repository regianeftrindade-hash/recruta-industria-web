# 🔒 PÁGINA DE CRIAR CONTA EMPRESA - BLOQUEADA
## Status: ✅ FINALIZADO E APROVADO

**Data de Bloqueio:** 03/01/2026

### Arquivos Bloqueados:
- `app/login/criar-conta/page.tsx` (formulário de registro rápido para empresa)

### Restrições:
❌ NÃO alterar layout ou espaçamento  
❌ NÃO remover componentes  
❌ NÃO modificar validações de CNPJ  
❌ NÃO alterar fluxo de redirecionamento  

### Alterações Permitidas:
✓ Ajustar mensagens de erro  
✓ Atualizar requisitos de validação  
✓ Melhorar UX/feedback do usuário  

### Fluxo Atual (NÃO ALTERAR):
1. Usuário clica "Sou Empresa"
2. Vai para `/login?tipo=empresa`
3. Clica "CRIAR CONTA"
4. Vai para `/login/criar-conta?tipo=empresa`
5. Preenche: Email, Senha, CNPJ
6. Valida CNPJ via BrasilAPI
7. Registra e redireciona para `/login?tipo=empresa`
8. Faz login
9. Vai para `/company/panel` (verifica se cadastro está completo)
10. Se incompleto → `/company/register` (cadastro completo)
11. Se completo → `/company/dashboard-empresa` (painel da empresa)

### Observações:
- O cadastro em 2 etapas é INTENCIONAL
- Primeira etapa: Dados básicos (simples)
- Segunda etapa: Dados completos (`/company/register`)
