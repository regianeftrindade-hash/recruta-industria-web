/**
 * Expande o catálogo espanhol a partir do blob comprimido (fonte: 755ea070 + CPF/CNPJ keys).
 * Gera es.json e es-seg-0..3 para o translate.ts.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogDir = join(root, "lib/i18n/messages/catalogs");
const single = join(catalogDir, "es.json.zlib.b64");
const partA = join(catalogDir, "es.json.zlib.b64.a");
const partB = join(catalogDir, "es.json.zlib.b64.b");

let b64;
if (existsSync(single)) {
  b64 = readFileSync(single, "utf8").trim();
} else {
  b64 = (readFileSync(partA, "utf8") + readFileSync(partB, "utf8")).trim();
}
const json = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
const data = JSON.parse(json);
const keys = Object.keys(data);
if (keys.length < 2000) {
  throw new Error(`Catálogo ES incompleto: ${keys.length} chaves`);
}
writeFileSync(join(catalogDir, "es.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
const items = Object.entries(data);
const n = 4;
const size = Math.ceil(items.length / n);
for (let i = 0; i < n; i++) {
  const part = Object.fromEntries(items.slice(i * size, (i + 1) * size));
  writeFileSync(join(catalogDir, `es-seg-${i}.json`), JSON.stringify(part), "utf8");
}
console.log(`ES catalog expanded: ${keys.length} keys → es.json + es-seg-0..3`);
