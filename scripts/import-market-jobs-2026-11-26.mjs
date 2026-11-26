/**
 * Importa vagas da varredura de mercado (docs/pesquisa-vagas-mercado-desde-2026-11-08.md).
 * Idempotente: IDs fixos cmimport20261126*.
 * Uso: node scripts/import-market-jobs-2026-11-26.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH = "import-mercado-2026-11-26";
const now = new Date();

function d(iso) {
  // Date-only UTC for @db.Date
  return new Date(`${iso}T00:00:00.000Z`);
}

function job(row) {
  const observations = [
    row.observations,
    `Fonte externa (${BATCH}). Confira o anúncio original antes de candidatar-se. O Recruta não cobra para se candidatar.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: row.id,
    companyName: row.companyName,
    confidential: false,
    publicationDate: d(row.publicationDate),
    title: row.title,
    salaryCents: null,
    salaryNegotiable: true,
    contractType: row.contractType || "OUTRO",
    contractTypeOther: row.contractTypeOther || null,
    workMode: row.workMode || "PRESENCIAL",
    workplace: row.workplace || null,
    description: row.description,
    observations,
    applicationInstructions: row.applicationInstructions || null,
    applicationMode: row.applicationMode,
    externalApplyUrl: row.externalApplyUrl || null,
    applicationEmail: row.applicationEmail || null,
    applicationWhatsapp: row.applicationWhatsapp || null,
    manualApplication: false,
    status: "PUBLISHED",
    origin: "ADMIN",
    companyUserId: null,
    createdByUserId: null,
    publishedAt: now,
    closedAt: null,
    countryCode: row.countryCode || "BR",
    locale: row.locale || "pt-BR",
    currency: row.currency || "BRL",
    timeZone: row.timeZone || "America/Sao_Paulo",
  };
}

const jobs = [
  // ——— Brasil ———
  job({
    id: "cmimport20261126tecnoval01",
    companyName: "Tecnoval Válvulas",
    title: "Soldador",
    workplace: "Dourados - MS",
    publicationDate: "2026-11-12",
    applicationMode: "EMAIL",
    applicationEmail: "rh@tecnoval.ind.br",
    applicationWhatsapp: "+551639449900",
    description:
      "A Tecnoval Válvulas está contratando Soldador para a filial de Dourados (MS).\n\nComo se candidatar: envie o currículo para rh@tecnoval.ind.br ou WhatsApp (16) 3944-9900.",
    applicationInstructions: "E-mail rh@tecnoval.ind.br ou WhatsApp (16) 3944-9900.",
  }),
  job({
    id: "cmimport20261126tecnoval02",
    companyName: "Tecnoval Válvulas",
    title: "Torneiro Mecânico",
    workplace: "Dourados - MS",
    publicationDate: "2026-11-12",
    applicationMode: "EMAIL",
    applicationEmail: "rh@tecnoval.ind.br",
    applicationWhatsapp: "+551639449900",
    description:
      "A Tecnoval Válvulas está contratando Torneiro Mecânico para a filial de Dourados (MS).\n\nComo se candidatar: envie o currículo para rh@tecnoval.ind.br ou WhatsApp (16) 3944-9900.",
  }),
  job({
    id: "cmimport20261126tecnoval03",
    companyName: "Tecnoval Válvulas",
    title: "Mecânico",
    workplace: "Dourados - MS",
    publicationDate: "2026-11-12",
    applicationMode: "EMAIL",
    applicationEmail: "rh@tecnoval.ind.br",
    applicationWhatsapp: "+551639449900",
    description:
      "A Tecnoval Válvulas está contratando Mecânico para a filial de Dourados (MS).\n\nComo se candidatar: envie o currículo para rh@tecnoval.ind.br ou WhatsApp (16) 3944-9900.",
  }),
  job({
    id: "cmimport20261126tecnoval04",
    companyName: "Tecnoval Válvulas",
    title: "Auxiliar de Mecânico",
    workplace: "Dourados - MS",
    publicationDate: "2026-11-12",
    applicationMode: "EMAIL",
    applicationEmail: "rh@tecnoval.ind.br",
    applicationWhatsapp: "+551639449900",
    description:
      "A Tecnoval Válvulas está contratando Auxiliar de Mecânico para a filial de Dourados (MS).\n\nComo se candidatar: envie o currículo para rh@tecnoval.ind.br ou WhatsApp (16) 3944-9900.",
  }),
  job({
    id: "cmimport20261126montarsul01",
    companyName: "Montarsul Group",
    title: "Soldador",
    workplace: "Rio Grande - RS",
    publicationDate: "2026-11-18",
    applicationMode: "EMAIL",
    applicationEmail: "recrutamento@montarsul.com.br",
    description:
      "O Grupo Montarsul seleciona Soldador para obra em Rio Grande/RS.\n\nRequisitos: residir em Rio Grande/RS; experiência na área.\n\nEnvie o currículo para recrutamento@montarsul.com.br informando a vaga no assunto.",
    applicationInstructions: "Assunto do e-mail: informar a vaga de interesse (Soldador).",
  }),
  job({
    id: "cmimport20261126montarsul02",
    companyName: "Montarsul Group",
    title: "Mecânico Montador",
    workplace: "Rio Grande - RS",
    publicationDate: "2026-11-18",
    applicationMode: "EMAIL",
    applicationEmail: "recrutamento@montarsul.com.br",
    description:
      "O Grupo Montarsul seleciona Mecânico Montador para obra em Rio Grande/RS.\n\nRequisitos: residir em Rio Grande/RS; experiência na área.\n\nEnvie o currículo para recrutamento@montarsul.com.br informando a vaga no assunto.",
  }),
  job({
    id: "cmimport20261126montarsul03",
    companyName: "Montarsul Group",
    title: "Técnico de Segurança do Trabalho",
    workplace: "Rio Grande - RS",
    publicationDate: "2026-11-18",
    applicationMode: "EMAIL",
    applicationEmail: "recrutamento@montarsul.com.br",
    description:
      "O Grupo Montarsul seleciona Técnico de Segurança para obra em Rio Grande/RS.\n\nRequisitos: residir em Rio Grande/RS; experiência na área.\n\nEnvie o currículo para recrutamento@montarsul.com.br informando a vaga no assunto.",
  }),
  job({
    id: "cmimport20261126torfresma01",
    companyName: "Torfresma",
    title: "Soldador Industrial",
    workplace: "Brasil",
    publicationDate: "2026-11-14",
    applicationMode: "EMAIL",
    applicationEmail: "curriculos@torfresma.com",
    externalApplyUrl: "https://torfresma.com",
    description:
      "A Torfresma está contratando Soldador Industrial / Auxiliar de Soldador Industrial.\n\nSaiba mais: https://torfresma.com\nEnvie o currículo para curriculos@torfresma.com ou entregue presencialmente em horário comercial.",
  }),
  job({
    id: "cmimport20261126torfresma02",
    companyName: "Torfresma",
    title: "Mecânico Industrial",
    workplace: "Brasil",
    publicationDate: "2026-11-14",
    applicationMode: "EMAIL",
    applicationEmail: "curriculos@torfresma.com",
    externalApplyUrl: "https://torfresma.com",
    description:
      "A Torfresma está contratando Mecânico Industrial / Auxiliar de Mecânico Industrial.\n\nSaiba mais: https://torfresma.com\nEnvie o currículo para curriculos@torfresma.com.",
  }),
  job({
    id: "cmimport20261126torfresma03",
    companyName: "Torfresma",
    title: "Eletricista Industrial",
    workplace: "Brasil",
    publicationDate: "2026-11-14",
    applicationMode: "EMAIL",
    applicationEmail: "curriculos@torfresma.com",
    externalApplyUrl: "https://torfresma.com",
    description:
      "A Torfresma está contratando Eletricista Industrial / Auxiliar de Eletricista Industrial.\n\nSaiba mais: https://torfresma.com\nEnvie o currículo para curriculos@torfresma.com.",
  }),
  job({
    id: "cmimport20261126msm01",
    companyName: "MSM Indústria Comércio e Serviços de Caldeiraria",
    title: "Soldador TIG e Multiprocessos",
    workplace: "Ribeirão Pires - SP",
    publicationDate: "2026-11-17",
    applicationMode: "EMAIL",
    applicationEmail: "cidilene.vaz@msmltda.com.br",
    applicationWhatsapp: "+5511985642579",
    description:
      "A MSM contrata Soldador TIG e Multiprocessos para caldeiraria pesada em Ribeirão Pires/SP.\n\nRequisito destacado: experiência em soldagem TIG de raiz em aço carbono e inox.\n\nCandidatura: WhatsApp (11) 98564-2579 ou e-mail cidilene.vaz@msmltda.com.br (informar a vaga).",
  }),
  // KAEFER — 6 especialidades (20 vagas cada no anúncio original)
  ...[
    ["kaefer01", "Mecânico Montador", "Experiência; vivência em obra de grande porte; disponibilidade para viagens."],
    ["kaefer02", "Mecânico Ajustador", "Experiência; vivência em obra de grande porte; disponibilidade para viagens."],
    ["kaefer03", "Soldador TIG/ER", "Indispensável habilidade em solda TIG; experiência; obra de grande porte; viagens."],
    ["kaefer04", "Eletricista Montador", "Necessário curso NR-10 (40h); experiência; obra de grande porte; viagens."],
    ["kaefer05", "Encanador Industrial", "Experiência; vivência em obra de grande porte; disponibilidade para viagens."],
    ["kaefer06", "Laminador de Fibra", "Experiência; vivência em obra de grande porte; disponibilidade para viagens."],
  ].map(([suf, title, req]) =>
    job({
      id: `cmimport20261126${suf}`,
      companyName: "KAEFER Teckma",
      title,
      workplace: "Inocência - MS",
      publicationDate: "2026-11-23",
      applicationMode: "EMAIL",
      applicationEmail: "cv.tk@kaefer.com",
      description: `A KAEFER Teckma anunciou vagas de ${title} (mobilização prevista para dezembro/2026) em Inocência/MS. O anúncio original indicava cerca de 20 oportunidades nesta especialidade, no total de 120 vagas.\n\nRequisitos: ${req}\nVagas abertas a diversidade e PCD.\n\nEnvie o currículo para cv.tk@kaefer.com com o cargo no assunto.\nA empresa alerta que não solicita pagamento para participar do processo seletivo.`,
      applicationInstructions: `Assunto do e-mail: ${title}`,
    }),
  ),

  // ——— Internacional ———
  job({
    id: "cmimport20261126philip01",
    companyName: "Philip Global",
    title: "Certified Industrial Welder",
    workplace: "Nuremberg - Germany",
    publicationDate: "2026-11-08",
    countryCode: "DE",
    locale: "en",
    currency: "EUR",
    timeZone: "Europe/Berlin",
    applicationMode: "EXTERNAL",
    externalApplyUrl:
      "https://talentglo.philipglobal.eu/philip-global/jobs/certified-industrial-welder-m-f-d-3dc399",
    description:
      "Direct employment for experienced industrial welders in Nuremberg (Germany).\n\nProcesses: TIG/WIG, MIG, MAG or MMA on steel, stainless or aluminum. ISO drawings and safety protocols.\n\nImmigration / support (as advertised): visa support, certificate conversion, German language training (A2/B1), relocation assistance.\n\nApply via the official form on the Philip Global job page.",
    applicationInstructions: "Use the official application form on the job page.",
    observations: "Confirmar se a vaga permanece aberta no site da Philip Global.",
  }),
  job({
    id: "cmimport20261126teupe01",
    companyName: "Teupe Gruppe",
    title: "Welder (m/f/d)",
    workplace: "Stadtlohn - Germany",
    publicationDate: "2026-11-08",
    countryCode: "DE",
    locale: "en",
    currency: "EUR",
    timeZone: "Europe/Berlin",
    applicationMode: "EMAIL",
    applicationEmail: "jobs@teupe.de",
    externalApplyUrl: "https://teupe.jobs.personio.de/job/2269241?language=en",
    description:
      "Welder (m/f/d) at Teupe Gruppe in Stadtlohn, Germany. TIG or MIG/MAG on steel assemblies; workshop and occasional site work.\n\nProfile: industrial/technical vocational training (fitter, metalworker, construction mechanic or similar); welding licences are an advantage.\n\nImmigration: employment in Germany typically requires a valid work visa / residence title — confirm with the employer.\n\nContact: jobs@teupe.de · +49 2563 9303-18 · Personio job page.",
  }),
  job({
    id: "cmimport20261126msnaval01",
    companyName: "Machado & Silveira",
    title: "Soldador MIG/MAG / TIG — Indústria Naval (Alemanha)",
    workplace: "Norte da Alemanha",
    publicationDate: "2026-11-25",
    countryCode: "DE",
    locale: "pt-PT",
    currency: "EUR",
    timeZone: "Europe/Berlin",
    applicationMode: "EMAIL",
    applicationEmail: "cv+54bb9a5e-e4e7-462f-b3a9-9964a56326c2@emprego.com",
    externalApplyUrl:
      "https://emprego.com/jobs/soldador-mf-norte-da-alemanha-54bb9a5e-e4e7-462f-b3a9-9964a56326c2",
    description:
      "Machado & Silveira recruta soldadores MIG/MAG, TIG e preparadores/tubistas para projetos da indústria naval no Norte da Alemanha.\n\nCondições anunciadas: alojamento pela empresa; viagens a Portugal a cada 3 meses; ciclos de 3 meses.\nRequisitos: experiência comprovada; leitura de desenhos; normas de segurança; certificado de soldadura valorizado.\n\nCandidatura por e-mail (emprego.com) com CV em PDF/DOCX.",
  }),
  job({
    id: "cmimport20261126empregode01",
    companyName: "Recrutamento via emprego.com",
    title: "Soldador MIG/MAG e TIG — Alemanha",
    workplace: "Alemanha",
    publicationDate: "2026-11-13",
    countryCode: "DE",
    locale: "pt-PT",
    currency: "EUR",
    timeZone: "Europe/Berlin",
    applicationMode: "EMAIL",
    applicationEmail: "cv+15bd4919-ddff-4300-a457-9ae5c0f1c8b6@emprego.com",
    externalApplyUrl:
      "https://emprego.com/jobs/soldador-migmag-e-tig-alemanha-15bd4919-ddff-4300-a457-9ae5c0f1c8b6",
    description:
      "Vaga de soldadura industrial MIG/MAG e TIG em obra na Alemanha (anúncio emprego.com).\n\nExigência destacada: Cartão de Cidadão português ou passaporte europeu (residência portuguesa isolada não aceita, segundo o anúncio).\nCondições anunciadas: cerca de €20/h; hospedagem, alimentação, transporte e passagem; projeto ~27 meses.\nInglês é diferencial.\n\nValid until ~14/12/2026 — confirme no anúncio.",
  }),
  job({
    id: "cmimport20261126rightlevel01",
    companyName: "RIGHT LEVEL",
    title: "Welder / Pipefitter / Industrial Fitter",
    workplace: "Portugal / France / Spain (projects)",
    publicationDate: "2026-11-08",
    countryCode: "PT",
    locale: "en",
    currency: "EUR",
    timeZone: "Europe/Lisbon",
    applicationMode: "EMAIL",
    applicationEmail: "geral@rightlevel.pt",
    externalApplyUrl: "https://www.rightlevel.pt/en/work-with-us",
    description:
      "RIGHT LEVEL recruits TIG/MIG/stick welders, pipefitters, boilermakers and industrial fitters for sites in Portugal, France and Spain.\n\nOffer (as advertised): Portuguese contract; travel, accommodation and paperwork handled by the company.\nRequirements: industrial site experience; reading isometrics/drawings; willingness to travel.\n\nImmigration: work/residence authorization in Portugal (AIMA) may apply for non-EU candidates — confirm with the company.\n\nApply: geral@rightlevel.pt or the Work with us page.",
  }),
  job({
    id: "cmimport20261126nbcnsw01",
    companyName: "Northern Beaches Council",
    title: "Welder",
    workplace: "Northern Beaches - NSW - Australia",
    publicationDate: "2026-11-25",
    countryCode: "AU",
    locale: "en",
    currency: "AUD",
    timeZone: "Australia/Sydney",
    applicationMode: "EXTERNAL",
    externalApplyUrl: "https://jobs.northernbeaches.nsw.gov.au/job/Welder/1370849766/",
    description:
      "Permanent full-time Welder / Fabricator at Northern Beaches Council (NSW, Australia). MIG, TIG and ARC; fabrication and maintenance of civil infrastructure assets.\n\nRequirements: recognised Trade Certificate in Welding/Boilermaking; MIG/TIG/ARC experience; current NSW Class C Driver Licence.\nSalary range advertised AUD 77,285.31–89,818.38 + super.\nApplications close 9 December 2026.\n\nImmigration: suitable Australian work visa required for non-citizens/permanent residents — confirm eligibility before applying.\n\nApply on the official Council jobs portal. Questions: Gus Mirabelli 0479 197 153.",
  }),
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const data of jobs) {
    const existing = await prisma.jobPosting.findUnique({ where: { id: data.id }, select: { id: true } });
    const { id, publishedAt, ...rest } = data;
    await prisma.jobPosting.upsert({
      where: { id },
      create: data,
      update: {
        ...rest,
        // Mantém publishedAt original em reexecução
        ...(existing ? {} : { publishedAt }),
      },
    });
    if (existing) updated += 1;
    else created += 1;
  }
  const totalPublished = await prisma.jobPosting.count({ where: { status: "PUBLISHED" } });
  console.log(
    JSON.stringify(
      {
        batch: BATCH,
        planned: jobs.length,
        created,
        updated,
        totalPublished,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
