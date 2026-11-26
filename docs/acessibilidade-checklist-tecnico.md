# Acessibilidade — checklist técnico (WCAG 2.2 AA)

**Escopo:** verificação sem redesenho visual (UI congelada).  
**Data:** 26/11/2026.

## Já observado / coberto indiretamente

| Item | Evidência |
|------|-----------|
| Contraste / tema dashboard | Tokens em `lib/ui/dashboard-theme` (não alterado nesta rodada) |
| E2E a11y tooling | `@axe-core/playwright` no projeto |
| Idioma / RTL | `htmlLang` + `textDirection("ar")="rtl"` testados |
| Captcha / formulários | Fluxos existentes preservados |

## Pendências que exigiriam mudança de UI (não executadas)

- Auditoria axe completa em todas as páginas autenticadas  
- Ajustes de foco visível / order tab em componentes congelados  
- Revisão de `alt` em imagens de marketing da home (página bloqueada)

## Critério para nota 10 em a11y

Só após: varredura axe em smoke + dashboards, correções autorizadas de UI, e contraste validado em light/dark sem regressão visual.
