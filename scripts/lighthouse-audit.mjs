#!/usr/bin/env node
/**
 * Lighthouse smoke em URLs públicas (Production ou Preview via BASE_URL).
 *
 * lighthouse/chrome-launcher ficam fora do package.json (não entram no build Next).
 * Preparar deps em /tmp e apontar NODE_PATH:
 *
 *   mkdir -p /tmp/lh-run && cd /tmp/lh-run && npm init -y && npm i lighthouse chrome-launcher
 *   NODE_PATH=/tmp/lh-run/node_modules BASE_URL=https://www.recrutaindustria.com \
 *     node --experimental-require-module scripts/lighthouse-audit.mjs
 *
 * Preferível copiar este arquivo para /tmp/lh-run e rodar de lá:
 *   BASE_URL=http://127.0.0.1:3000 node /tmp/lh-run/run.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const requireFrom = (base) => createRequire(join(base, "package.json"));

function loadDeps() {
  const candidates = [
    process.env.LH_NODE_MODULES,
    process.env.NODE_PATH?.split(":").find(Boolean),
    "/tmp/lh-run/node_modules",
    join(process.cwd(), "node_modules"),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (!existsSync(join(dir, "lighthouse")) || !existsSync(join(dir, "chrome-launcher"))) {
      continue;
    }
    const req = createRequire(join(dir, "lighthouse/package.json"));
    const lighthouse = req("lighthouse");
    const chromeLauncher = req("chrome-launcher");
    return {
      lighthouse: lighthouse.default || lighthouse,
      chromeLauncher,
    };
  }
  console.error(
    "Instale lighthouse em /tmp/lh-run (ver cabeçalho do script) e rode de novo.",
  );
  process.exit(1);
}

const { lighthouse, chromeLauncher } = loadDeps();

const base = (process.env.BASE_URL || "https://www.recrutaindustria.com").replace(/\/$/, "");
const paths = ["/", "/vagas", "/professional/cadastro", "/company/cadastro"];
const outDir = "/tmp/lighthouse-recruta";
mkdirSync(outDir, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});

const summary = [];
try {
  for (const path of paths) {
    const url = `${base}${path}`;
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
    });
    const lhr = result.lhr;
    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)]),
    );
    const row = { path, url, scores };
    summary.push(row);
    writeFileSync(`${outDir}${path === "/" ? "/home" : path.replace(/\//g, "-")}.json`, JSON.stringify(lhr));
    console.log(JSON.stringify(row));
  }
} finally {
  await chrome.kill();
}

writeFileSync(`${outDir}/summary.json`, JSON.stringify(summary, null, 2));
console.log("summary_written", `${outDir}/summary.json`);
