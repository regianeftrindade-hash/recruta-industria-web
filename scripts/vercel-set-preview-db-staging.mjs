#!/usr/bin/env node
/**
 * Configura SOMENTE o ambiente Preview da Vercel para usar o banco Staging.
 *
 * Uso:
 *   VERCEL_TOKEN=... STAGING_DATABASE_URL=... STAGING_DIRECT_URL=... \
 *     node scripts/vercel-set-preview-db-staging.mjs           # dry-run
 *   ... node scripts/vercel-set-preview-db-staging.mjs --apply # grava Preview
 *
 * Nunca altera Production. Recusa se a URL Staging apontar para Production
 * ou se faltar token/credenciais Staging.
 *
 * Não imprime senhas — só host/porta/ref do projeto.
 */
import { parseArgs } from "node:util";

const PRODUCTION_REF = "yxwgjlzzxkitvcduckgk";
const STAGING_REF = "gshhznyretzrdnmkgmgj";

const { values } = parseArgs({
  options: {
    apply: { type: "boolean", default: false },
    "project-id": { type: "string" },
    team: { type: "string" },
  },
  strict: true,
});

function fingerprint(urlString, label) {
  let u;
  try {
    u = new URL(urlString);
  } catch {
    throw new Error(`${label}: URL inválida`);
  }
  const user = decodeURIComponent(u.username || "");
  const ref =
    user.includes(".") ? user.split(".").pop() : user.match(/^[a-z]{20}$/)?.[0] || null;
  return {
    label,
    host: u.hostname,
    port: u.port || "(default)",
    projectRef: ref,
    hasPgBouncer: u.searchParams.get("pgbouncer") === "true",
    sslmode: u.searchParams.get("sslmode") || "(unset)",
  };
}

function ensureStagingPooler(urlString) {
  const u = new URL(urlString);
  if (!u.hostname.includes("sa-east-1") && !u.username.includes(STAGING_REF)) {
    throw new Error("STAGING_DATABASE_URL não parece Staging (sa-east-1 / gshhz…)");
  }
  if (urlString.includes(PRODUCTION_REF)) {
    throw new Error("STAGING_DATABASE_URL aponta para Production — abortado");
  }
  if ((u.port || "5432") === "6543" && u.searchParams.get("pgbouncer") !== "true") {
    u.searchParams.set("pgbouncer", "true");
  }
  if (!u.searchParams.get("sslmode")) u.searchParams.set("sslmode", "require");
  return u.toString();
}

function ensureStagingDirect(urlString) {
  const u = new URL(urlString);
  if (urlString.includes(PRODUCTION_REF)) {
    throw new Error("STAGING_DIRECT_URL aponta para Production — abortado");
  }
  if (!u.searchParams.get("sslmode")) u.searchParams.set("sslmode", "require");
  return u.toString();
}

async function vercel(path, { method = "GET", body } = {}) {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) throw new Error("VERCEL_TOKEN ausente — não é possível alterar Preview");
  const team = values.team || process.env.VERCEL_TEAM_ID || "";
  const qs = team ? `?teamId=${encodeURIComponent(team)}` : "";
  const res = await fetch(`https://api.vercel.com${path}${qs}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(`Vercel ${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

async function main() {
  const stagingDb = process.env.STAGING_DATABASE_URL?.trim();
  const stagingDirect = process.env.STAGING_DIRECT_URL?.trim();
  if (!stagingDb || !stagingDirect) {
    throw new Error("Defina STAGING_DATABASE_URL e STAGING_DIRECT_URL (valores Staging)");
  }

  const databaseUrl = ensureStagingPooler(stagingDb);
  const directUrl = ensureStagingDirect(stagingDirect);

  console.log("Alvos Preview (sem senhas):");
  console.log(JSON.stringify(fingerprint(databaseUrl, "DATABASE_URL"), null, 2));
  console.log(JSON.stringify(fingerprint(directUrl, "DIRECT_URL"), null, 2));

  for (const fp of [fingerprint(databaseUrl, "DATABASE_URL"), fingerprint(directUrl, "DIRECT_URL")]) {
    if (fp.projectRef === PRODUCTION_REF) {
      throw new Error("Abortado: fingerprint aponta Production");
    }
    if (fp.projectRef && fp.projectRef !== STAGING_REF) {
      console.warn(`Aviso: projectRef=${fp.projectRef} (esperado ${STAGING_REF})`);
    }
  }

  if (!values.apply) {
    console.log("Dry-run OK. Passe --apply para gravar SOMENTE no ambiente Preview.");
    return;
  }

  const projectId =
    values["project-id"] ||
    process.env.VERCEL_PROJECT_ID ||
    (await resolveProjectId());

  const keys = [
    { key: "DATABASE_URL", value: databaseUrl },
    { key: "DIRECT_URL", value: directUrl },
    { key: "STAGING_DATABASE_URL", value: databaseUrl },
    { key: "STAGING_DIRECT_URL", value: directUrl },
  ];

  for (const { key, value } of keys) {
    // Upsert com target Preview apenas — nunca Production / Development.
    await vercel(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: {
        key,
        value,
        type: "encrypted",
        target: ["preview"],
        upsert: true,
      },
    });
    console.log(`Preview upsert: ${key}`);
  }

  console.log("Concluído: Preview aponta para Staging. Production não foi alterada.");
  console.log("Faça redeploy do Preview do PR para aplicar as envs.");
}

async function resolveProjectId() {
  const list = await vercel("/v9/projects");
  const projects = list.projects || list;
  const hit = (Array.isArray(projects) ? projects : []).find(
    (p) => p.name === "recruta-industria-web" || p.name === "recrutaindustria",
  );
  if (!hit?.id) throw new Error("Projeto Vercel não encontrado — passe --project-id");
  return hit.id;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
