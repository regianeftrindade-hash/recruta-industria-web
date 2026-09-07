/**
 * Gera favicon e ícones PWA a partir do wordmark atual.
 * - Fundo transparente (só o texto)
 * - Se precisar de fundo: círculo justo em volta do nome
 *
 * Uso: node scripts/generate-icons.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "logo-texto-recruta.png");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const APP_DIR = path.join(ROOT, "app");

function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const buf of pngBuffers) {
    const size = buf.length;
    const widthPx = buf.readUInt32BE(16);
    const heightPx = buf.readUInt32BE(20);
    entries.push({
      width: widthPx >= 256 ? 0 : widthPx,
      height: heightPx >= 256 ? 0 : heightPx,
      size,
      offset,
      buf,
    });
    offset += size;
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

  entries.forEach((e) => {
    e.buf.copy(out, e.offset);
  });

  return out;
}

/** Remove fundo preto e corta até o texto. */
async function extractWordmark() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    // Preto / quase preto → transparente
    if (r < 28 && g < 28 && b < 28) {
      out[i + 3] = 0;
    }
  }

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = out[(y * info.width + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 2;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(info.width - left, maxX - minX + 1 + pad * 2);
  const height = Math.min(info.height - top, maxY - minY + 1 + pad * 2);

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

/** Ícone quadrado transparente — só o texto, sem fundo. */
async function makeTransparentIcon(wordmark, size, contentRatio = 0.88) {
  const maxSide = Math.round(size * contentRatio);
  const fitted = await sharp(wordmark)
    .resize(maxSide, maxSide, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: "centre" }])
    .png()
    .toBuffer();
}

/**
 * Ícone com fundo circular justo em volta do nome
 * (para Apple / maskable, onde fundo ajuda).
 * Cantos fora do círculo ficam transparentes.
 */
async function makeCircledIcon(wordmark, size) {
  // Texto ocupa ~58% do canvas para o círculo não virar um quadrado preto
  const maxSide = Math.round(size * 0.58);
  const fitted = await sharp(wordmark)
    .resize(maxSide, maxSide, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(fitted).metadata();
  const fw = meta.width || maxSide;
  const fh = meta.height || maxSide;
  // Diâmetro: envolve só o bloco do nome + margem pequena
  const diameter = Math.min(
    Math.round(size * 0.92),
    Math.ceil(Math.hypot(fw, fh) * 0.55 + Math.max(fw, fh) * 0.42)
  );
  const r = diameter / 2;
  const cx = size / 2;
  const cy = size / 2;

  const circleSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#000000"/>
    </svg>`
  );

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: circleSvg, gravity: "centre" },
      { input: fitted, gravity: "centre" },
    ])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Fonte não encontrada: ${SOURCE}`);
  }

  fs.mkdirSync(ICONS_DIR, { recursive: true });
  const wordmark = await extractWordmark();
  fs.writeFileSync(path.join(ICONS_DIR, "wordmark-source.png"), wordmark);
  console.log("✓ icons/wordmark-source.png (texto sem fundo)");

  const transparentSizes = [
    { name: "wordmark-16.png", size: 16, ratio: 0.94 },
    { name: "wordmark-32.png", size: 32, ratio: 0.92 },
    { name: "wordmark-192.png", size: 192, ratio: 0.9 },
    { name: "wordmark-512.png", size: 512, ratio: 0.9 },
    { name: "icon-16.png", size: 16, ratio: 0.94 },
    { name: "icon-32.png", size: 32, ratio: 0.92 },
    { name: "icon-192.png", size: 192, ratio: 0.9 },
    { name: "icon-512.png", size: 512, ratio: 0.9 },
    { name: "ri-16.png", size: 16, ratio: 0.94 },
    { name: "ri-32.png", size: 32, ratio: 0.92 },
    { name: "ri-192.png", size: 192, ratio: 0.9 },
    { name: "ri-512.png", size: 512, ratio: 0.9 },
  ];

  for (const item of transparentSizes) {
    const buf = await makeTransparentIcon(wordmark, item.size, item.ratio);
    fs.writeFileSync(path.join(ICONS_DIR, item.name), buf);
    console.log("✓ icons/" + item.name + " (transparente)");
  }

  // App / Next: transparente
  fs.writeFileSync(
    path.join(APP_DIR, "icon.png"),
    await makeTransparentIcon(wordmark, 512, 0.9)
  );
  console.log("✓ app/icon.png (transparente)");

  // Apple / maskable: círculo justo em volta do nome
  const circled = [
    { file: path.join(ICONS_DIR, "wordmark-apple-touch.png"), size: 180 },
    { file: path.join(ICONS_DIR, "apple-touch-icon.png"), size: 180 },
    { file: path.join(ICONS_DIR, "ri-apple-touch.png"), size: 180 },
    { file: path.join(ICONS_DIR, "wordmark-512-maskable.png"), size: 512 },
    { file: path.join(ICONS_DIR, "icon-512-maskable.png"), size: 512 },
    { file: path.join(ICONS_DIR, "ri-512-maskable.png"), size: 512 },
    { file: path.join(APP_DIR, "apple-icon.png"), size: 180 },
  ];

  for (const item of circled) {
    const buf = await makeCircledIcon(wordmark, item.size);
    fs.writeFileSync(item.file, buf);
    console.log("✓", path.relative(ROOT, item.file), "(círculo justo)");
  }

  const icoPngs = await Promise.all([
    makeTransparentIcon(wordmark, 16, 0.94),
    makeTransparentIcon(wordmark, 32, 0.92),
    makeTransparentIcon(wordmark, 48, 0.9),
  ]);
  const ico = encodeIco(icoPngs);
  fs.writeFileSync(path.join(ROOT, "public", "favicon.ico"), ico);
  fs.writeFileSync(path.join(ROOT, "public", "favicon-wordmark.ico"), ico);
  fs.writeFileSync(path.join(ROOT, "public", "favicon-ri.ico"), ico);
  fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), ico);
  console.log("✓ favicon.ico (texto sem fundo)");
  console.log("Ícones atualizados.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
