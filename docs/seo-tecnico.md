# SEO técnico — checklist (pós-auditoria)

**Data:** 26/11/2026 · Estratégia: URLs únicas (sem prefixo `/en/...`); idioma via cookie / `Accept-Language`.

## Já em produção

| Item | Estado |
|------|--------|
| `robots.txt` | Allow `/`; disallow api/admin/dashboards |
| `sitemap.xml` | Páginas estáticas + vagas públicas (até 5k) |
| `hreflang` / `alternates.languages` | 12 idiomas + `x-default` na **mesma** URL |
| `metadataBase` / canonical | `https://www.recrutaindustria.com` |
| Open Graph / Twitter | Presentes no layout raiz |
| PWA manifest | `/manifest.json` e `/manifest.webmanifest` |

## Não fazer sem pedido

- Não inventar vagas, reviews ou conteúdo falso para SEO.  
- Não mudar URLs públicas sem redirect 301 planejado.  
- Não alterar home/login/dashboards (congelados).

## Melhorias de discovery (conteúdo / marca — fora desta rodada de código)

- Página institucional / blog com casos reais.  
- Google Search Console + Bing Webmaster.  
- Perfil LinkedIn oficial alinhado ao domínio.  
- Revisar rich results JobPosting nas páginas `/vagas/[id]` (já há schema no app — validar no Rich Results Test após deploy).
