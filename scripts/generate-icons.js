const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  // Create a simple blue square with text
  const svgImage = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#001f3f"/>
    <text x="256" y="256" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dy="0.3em">RI</text>
  </svg>`;

  for (const size of sizes) {
    await sharp(Buffer.from(svgImage))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    
    console.log(`✓ icon-${size}.png criado`);
  }
  
  console.log('✓ Todos os ícones foram gerados');
}

generateIcons().catch(err => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
