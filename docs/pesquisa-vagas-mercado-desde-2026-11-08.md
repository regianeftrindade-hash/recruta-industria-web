# Varredura de mercado — vagas industriais (desde 08/11/2026)

**Data da pesquisa:** 26/11/2026 (America/São Paulo)  
**Critérios:** anúncios com indício de data ≥ 08/11/2026; contato por e-mail, WhatsApp ou link de candidatura; foco industrial; BR + países relevantes aos idiomas/mercados do Recruta.  
**Importante:** pesquisa externa. Em 26/11/2026 (autorização explícita do usuário):
1. **23 vagas** da varredura geral via `scripts/import-market-jobs-2026-11-26.mjs` (IDs `cmimport20261126*` sem sufixo `ec`; MECTON omitida).
2. **255 vagas** industriais do [Emprega Campinas](https://empregacampinas.com.br/) (≥08/11, prazo ainda aberto, com e-mail) via `scripts/import-empregacampinas-since-2026-11-08.mjs` (IDs `cmimport20261126ec*`).

Total PUBLISHED após ambos: **1.374**. Validar sempre no anúncio original; anúncios externos podem expirar.

---

## Brasil

| Empresa / fonte | Local | Funções | Contato | Exigências destacadas | Data (fonte) |
|-----------------|-------|---------|---------|------------------------|--------------|
| Tecnoval Válvulas | Dourados/MS | Torneiro, Mecânico, Aux. Mecânico, Soldador | `rh@tecnoval.ind.br` · WhatsApp `(16) 3944-9900` | Filial Dourados; enviar currículo | LinkedIn ~12/11/2026 |
| Montarsul Group | Rio Grande/RS | Soldador, mecânicos, andaimes, TSS, etc. | `recrutamento@montarsul.com.br` | **Residir em Rio Grande/RS**; experiência; informar vaga no assunto | LinkedIn ~18/11/2026 |
| Torfresma | (site Torfresma) | Soldador, mecânico, eletricista, automação, CNC… | `curriculos@torfresma.com` · https://torfresma.com | Ver requisitos por vaga no site; pode entregar CV presencial | LinkedIn ~14/11/2026 |
| MSM Caldeiraria | Ribeirão Pires/SP | Soldador TIG / multiprocessos | WhatsApp `(11) 98564-2579` · `cidilene.vaz@msmltda.com.br` | TIG raiz carbono/inox; caldeiraria pesada | LinkedIn ~17/11/2026 |
| KAEFER Teckma | Inocência/MS | 120 vagas (20× montador, ajustador, soldador TIG/ER, eletricista, encanador, laminador) | `cv.tk@kaefer.com` (assunto = cargo) | Experiência; obra de grande porte; viagens; solda TIG; eletricista **NR-10 40h**; PCD/diversidade | Divulgação 23/11/2026 |

### Exigências legais / práticas típicas (BR)
- Documentação trabalhista brasileira (CPF, CTPS quando aplicável).  
- NRs conforme função (ex.: NR-10, NR-35, NR-33) quando exigidas no anúncio.  
- Não há visto de trabalho para brasileiro no próprio Brasil.

---

## Internacional (aceita ou facilita imigrante / mobilidade — quando declarado)

| País | Empresa / fonte | Função | Contato / candidatura | Exigências / imigração | Observação de data |
|------|-----------------|--------|------------------------|------------------------|--------------------|
| Alemanha | Philip Global (Nuremberg) | Certified Industrial Welder | https://talentglo.philipglobal.eu/... (formulário) | Visa support, conversão de certificado, alemão A2/B1 apoiado; TIG/MIG/MAG/MMA; leitura ISO | Data de publicação não explícita na página — **validar se ainda aberta** |
| Alemanha | Teupe Gruppe (Stadtlohn) | Welder (m/f/d) | `jobs@teupe.de` · +49 2563 9303-18 | Formação metal/mecânica; licenças de solda vantagem; TIG/MIG-MAG | Confirmar abertura atual no Personio |
| Alemanha (via PT) | Machado & Silveira | Soldadores MIG/MAG/TIG, tubistas (indústria naval, norte DE) | `cv+54bb9a5e-…@emprego.com` | Experiência naval/tubagem; certificado; alojamento pela empresa; ciclos 3 meses | Anúncio recente (emprego.com, “posted yesterday” em 26/11/2026) |
| Alemanha (via PT) | (emprego.com) Soldador MIG/MAG e TIG | Soldadura industrial | `cv+15bd4919-…@emprego.com` | **Passaporte europeu / CC português** (não aceita apenas residência PT); certificados; inglês diferencial; €20/h; hospedagem/alimentação/transporte | Valid until ~14/12; posted ~13/11/2026 |
| Portugal / EU | RIGHT LEVEL | Welders, pipefitters, fitters (PT/FR/ES) | `geral@rightlevel.pt` · site rightlevel.pt | Contrato português; travel/accommodation/paperwork; experiência industrial | Recrutamento contínuo — confirmar vaga ativa |
| Austrália | Northern Beaches Council (NSW) | Welder permanente | Portal jobs.northernbeaches.nsw.gov.au · tel. Gus Mirabelli `0479 197 153` | Trade certificate; MIG/TIG/ARC; **NSW Class C licence**; fecha **09/12/2026** | Listado 25/11/2026 |
| Emirados (Abu Dhabi) | MECTON | MIG/ARC, SMAW, TIG, Duplex | `cv@mectongroup.net` · WhatsApp `+974 5041 2742` | Visa, medical, food, accommodation; **all nationalities** no anúncio; entrevista walk-in Lusail (Qatar) | Entrevistas 25–30/10/2026 — **fora da janela ≥08/11**; só útil se houver reabertura |

### Exigências típicas por país (resumo operacional — validar com advogado/imigração)

| País | Pontos críticos para candidato estrangeiro |
|------|---------------------------------------------|
| Alemanha | Visto de trabalho / Blue Card / §18a/§18b conforme qualificação; reconhecimento de certificado de solda; alemão frequentemente A2+; contrato local |
| Portugal | Autorização de residência/trabalho SEF/AIMA; contrato português; para obras noutros países da UE pode haver destacamento |
| Emirados | Employment visa patrocinado pelo empregador; exames médicos; às vezes restrição de nacionalidade ou “visit visa in country” |
| Austrália | Visa subclass adequada (ex. skilled/employer sponsored); licenças estaduais (ex. NSW driver licence para a vaga do Council); trade recognition |
| EUA/Canadá/JP/KR etc. | Não houve anúncios claros com contato + data ≥08/11 nesta varredura — **não inventar** |

---

## Pós-importação (26/11/2026)
- Script idempotente: `node scripts/import-market-jobs-2026-11-26.mjs`
- BR: Tecnoval (4), Montarsul (3), Torfresma (3), MSM (1), KAEFER (6 especialidades).
- Internacional: Philip Global, Teupe, Machado & Silveira, emprego.com DE, RIGHT LEVEL, Northern Beaches Council.
- **Omitida:** MECTON (entrevistas 25–30/10/2026, fora da janela ≥08/11).
- Cada vaga traz contato (e-mail / WhatsApp / link) e aviso de fonte externa nas observações.

## Cuidados
- Não republicar sem checagem de autenticidade (golpes de “pague para se candidatar”).  
- Não tratar a pesquisa como inventário completo das vagas internas do Recruta.
