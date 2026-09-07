/**
 * Gera favicon e ícones PWA a partir do símbolo oficial (simbolo-recruta.png).
 * Uso: node scripts/generate-symbol-icons.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "simbolo-recruta.png");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const APP_DIR = path.join(ROOT, "app");
const PUBLIC_DIR = path.join(ROOT, "public");

function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  let offset = 6 + count * 16;
  const entries = [];
  for (const buf of pngBuffers) {
    entries.push({
      width: buf.readUInt32BE(16) >= 256 ? 0 : buf.readUInt32BE(16),
      height: buf.readUInt32BE(20) >= 256 ? 0 : buf.readUInt32BE(20),
      size: buf.length,
      offset,
      buf,
    });
    offset += buf.length;
  }
  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);
  entries.forEach((e, i) => {
    const o = 6 + i * 16;
    out.writeUInt8(e.width, o);
    out.writeUInt8(e.height, o + 1);
    out.writeUInt8(0, o + 2);
    out.writeUInt8(0, o + 3);
    out.writeUInt16LE(1, o + 4);
    out.writeUInt16LE(32, o + 6);
    out.writeUInt32LE(e.size, o + 8);
    out.writeUInt32LE(e.offset, o + 12);
  });
  entries.forEach((e) => e.buf.copy(out, e.offset));
  return out;
}

async function resizeSquare(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Símbolo não encontrado: ${SOURCE}`);
  }
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const master = await resizeSquare(512);
  fs.writeFileSync(path.join(ICONS_DIR, "symbol-ri.png"), master);
  fs.writeFileSync(path.join(PUBLIC_DIR, "symbol-ri.png"), master);
  console.log("✓ symbol-ri.png");

  const outputs = [
    ["ri-16.png", 16],
    ["ri-32.png", 32],
    ["ri-192.png", 192],
    ["ri-512.png", 512],
    ["ri-512-maskable.png", 512],
    ["ri-apple-touch.png", 180],
    ["icon-16.png", 16],
    ["icon-32.png", 32],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["icon-512-maskable.png", 512],
    ["apple-touch-icon.png", 180],
    ["wordmark-16.png", 16],
    ["wordmark-32.png", 32],
    ["wordmark-192.png", 192],
    ["wordmark-512.png", 512],
    ["wordmark-512-maskable.png", 512],
    ["wordmark-apple-touch.png", 180],
  ];

  for (const [name, size] of outputs) {
    const buf = size === 512 ? master : await resizeSquare(size);
    fs.writeFileSync(path.join(ICONS_DIR, name), buf);
    console.log("✓ icons/" + name);
  }

  fs.writeFileSync(path.join(APP_DIR, "icon.png"), master);
  fs.writeFileSync(path.join(APP_DIR, "apple-icon.png"), await resizeSquare(180));
  console.log("✓ app/icon.png");
  console.log("✓ app/apple-icon.png");

  const ico = encodeIco(await Promise.all([16, 32, 48].map((s) => resizeSquare(s))));
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), ico);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-ri.ico"), ico);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-wordmark.ico"), ico);
  fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), ico);
  console.log("✓ favicon.ico");
  console.log("Ícones gerados a partir do símbolo oficial.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
