# SEO técnico — checklist (pós-auditoria)

**Data:** 26/11/2026 · Estratégia: URLs únicas (sem prefixo `/en/...`); idioma via cookie / `Accept-Language`.

## Já em produção / código

| Item | Estado |
|------|--------|
| `robots.txt` | Allow `/`; disallow api/admin/dashboards (`app/robots.ts`) |
| `sitemap.xml` | Páginas estáticas + vagas públicas (até 5k) + hreflang |
| `hreflang` / `alternates.languages` | 12 idiomas + `x-default` na **mesma** URL (`lib/seo/language-alternates.ts`) |
| `metadataBase` / canonical | `https://www.recrutaindustria.com` |
| Open Graph / Twitter | Presentes no layout raiz |
| PWA manifest | `/manifest.json` e `/manifest.webmanifest` |
| Search Console | Playbook humano: `docs/seo-search-console-playbook.md` |

## Não fazer sem pedido

- Não inventar vagas, reviews ou conteúdo falso para SEO.  
- Não mudar URLs públicas sem redirect 301 planejado.  
- Não alterar layout visual de home/login/dashboards (congelados), salvo a11y autorizada.

## Melhorias de discovery (conteúdo / marca — humanos)

- Página institucional / blog com casos **reais** e autorizados.  
- Google Search Console + Bing Webmaster (ver playbook).  
- Perfil LinkedIn oficial alinhado ao domínio.  
- Validar rich results JobPosting em `/vagas/[id]` no Rich Results Test após deploy.
