# Playbook — Google Search Console e discovery (sem inventar conteúdo)

**Status:** guia operacional.  
**Não cria** propriedades no Search Console, **não inventa** blog posts, reviews ou vagas.

---

## 1. Já coberto no código

| Item | Onde |
|------|------|
| `robots.txt` Allow `/` + disallow api/admin/dashboards | `app/robots.ts` |
| `sitemap.xml` estáticas + vagas públicas (≤5k) + hreflang | `app/sitemap.ts` |
| 12 idiomas + `x-default` (mesma URL) | `lib/seo/language-alternates.ts` |
| `metadataBase` / OG / Twitter | `app/layout.tsx` |
| JobPosting schema | páginas `/vagas/[id]` (validar no Rich Results Test após deploy) |

## 2. Passos humanos (Search Console)

1. Verificar propriedade `https://www.recrutaindustria.com` (DNS TXT ou HTML — escolher um método real).  
2. Preferir domínio canônico **www** (já usado em `metadataBase` / sitemap).  
3. Enviar sitemap: `https://www.recrutaindustria.com/sitemap.xml`.  
4. Monitorar Cobertura / Experience / Core Web Vitals.  
5. Opcional: Bing Webmaster com o mesmo sitemap.  
6. Não pedir indexação de `/api/*`, `/admin*`, dashboards (já em `disallow`).

## 3. Melhorias de conteúdo real (fora do código até haver material verdadeiro)

- Página institucional / sobre com dados reais da empresa (razão social, etc.).  
- Casos ou depoimentos **somente** com autorização por escrito.  
- Blog técnico só com textos revisados (não gerar filler SEO).  
- Alinhar LinkedIn oficial ao domínio e à marca Recruta Indústria.  
- Revisar keywords do layout se o marketing oficial mudar (hoje há lista em PT no `generateMetadata`).

## 4. O que esta rodada de código NÃO faz

- Não altera copy comercial da home/login/dashboards.  
- Não cria rotas `/en/...` (estratégia deliberada: cookie / Accept-Language).  
- Não inventa rich results falsos.  
- Não configura a conta Google da empresa.
