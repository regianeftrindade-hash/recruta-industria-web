# Acessibilidade — checklist técnico (WCAG 2.2 AA)

**Escopo:** verificação com axe; correções só quando autorizadas e sem redesenho.  
**Data:** 26/11/2026.

## Tooling

| Item | Evidência |
|------|-----------|
| E2E axe | `e2e/a11y-axe.spec.ts` — tags `wcag2a/aa`, `wcag21a/aa`, **`wcag22aa`** |
| Alvo | Home, login, cadastros, vagas, painéis profissional/empresa (com secrets E2E) |
| Idioma / RTL | `htmlLang` + `textDirection("ar")="rtl"` testados |
| Contraste / tema dashboard | Tokens em `lib/ui/dashboard-theme` (não reestilizar sem pedido) |

## Política de correção

- Preferir atributos ARIA / labels / `alt` / ordem de foco **sem** mudar CSS visual.  
- Home, login e dashboards: alterar JSX/CSS **somente** para eliminar violações serious/critical do axe, preservando layout.  
- Não “melhorar” UX de passagem.

## Resultado desta rodada (26/11/2026)

- Produção (antes do fix): home/`/login`→home com `target-size` no botão “Mostrar senha” (22×22).  
- Correção: override inline em `app/page.tsx` → **24×24** (sem redesenho).  
- Revalidação local: `e2e/a11y-axe.spec.ts` **7/7 passed** (home, login, cadastros, vagas, painéis).

## Critério para nota 10 em a11y

Varredura axe sem serious/critical nas rotas críticas + contraste light/dark validado sem regressão visual + revisão humana de teclado/leitor de tela.
