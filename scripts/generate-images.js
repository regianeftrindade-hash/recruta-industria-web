const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

async function generateImages() {
  // Professional image - industrial workers
  const svgProf = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgProf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B7355;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#5C4033;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bgProf)"/>
    <!-- Worker 1 -->
    <circle cx="80" cy="80" r="20" fill="#F4A460"/>
    <ellipse cx="80" cy="120" rx="25" ry="35" fill="#FF8C00"/>
    <rect x="60" y="155" width="15" height="50" fill="#1C1C1C"/>
    <rect x="85" y="155" width="15" height="50" fill="#1C1C1C"/>
    <!-- Worker 2 -->
    <circle cx="200" cy="60" r="22" fill="#DEB887"/>
    <ellipse cx="200" cy="110" rx="28" ry="40" fill="#4169E1"/>
    <rect x="178" y="150" width="16" height="55" fill="#2F4F4F"/>
    <rect x="206" y="150" width="16" height="55" fill="#2F4F4F"/>
    <!-- Worker 3 -->
    <circle cx="320" cy="85" r="20" fill="#CD853F"/>
    <ellipse cx="320" cy="130" rx="26" ry="36" fill="#FFD700"/>
    <rect x="300" y="166" width="14" height="48" fill="#000"/>
    <rect x="324" y="166" width="14" height="48" fill="#000"/>
    <!-- Industrial elements -->
    <rect x="150" y="40" width="30" height="100" fill="#696969" opacity="0.6"/>
    <rect x="200" y="30" width="25" height="60" fill="#A9A9A9" opacity="0.5"/>
    <!-- Ambient light -->
    <rect width="400" height="300" fill="#FFA500" opacity="0.15"/>
  </svg>`;

  // Company image - industrial facility
  const svgComp = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgComp" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#696969;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2F4F4F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bgComp)"/>
    <!-- Factory building -->
    <rect x="60" y="80" width="280" height="160" fill="#A9A9A9"/>
    <!-- Windows row 1 -->
    <rect x="80" y="100" width="20" height="20" fill="#87CEEB"/>
    <rect x="120" y="100" width="20" height="20" fill="#87CEEB"/>
    <rect x="160" y="100" width="20" height="20" fill="#87CEEB"/>
    <rect x="200" y="100" width="20" height="20" fill="#87CEEB"/>
    <rect x="240" y="100" width="20" height="20" fill="#87CEEB"/>
    <rect x="280" y="100" width="20" height="20" fill="#87CEEB"/>
    <!-- Windows row 2 -->
    <rect x="80" y="145" width="20" height="20" fill="#87CEEB"/>
    <rect x="120" y="145" width="20" height="20" fill="#87CEEB"/>
    <rect x="160" y="145" width="20" height="20" fill="#87CEEB"/>
    <rect x="200" y="145" width="20" height="20" fill="#87CEEB"/>
    <rect x="240" y="145" width="20" height="20" fill="#87CEEB"/>
    <rect x="280" y="145" width="20" height="20" fill="#87CEEB"/>
    <!-- Roof -->
    <polygon points="60,80 200,30 340,80" fill="#696969"/>
    <!-- Door -->
    <rect x="185" y="200" width="30" height="40" fill="#8B4513"/>
    <!-- Chimneys -->
    <rect x="100" y="20" width="15" height="60" fill="#696969"/>
    <rect x="285" y="30" width="15" height="50" fill="#696969"/>
    <!-- Industrial equipment details -->
    <rect x="40" y="100" width="15" height="140" fill="#FFD700" opacity="0.7"/>
    <rect x="345" y="110" width="15" height="130" fill="#FFD700" opacity="0.7"/>
  </svg>`;

  try {
    await sharp(Buffer.from(svgProf))
      .resize(400, 300)
      .png()
      .toFile(path.join(publicDir, 'professional.png'));
    console.log('✓ professional.png criado');

    await sharp(Buffer.from(svgComp))
      .resize(400, 300)
      .png()
      .toFile(path.join(publicDir, 'company.png'));
    console.log('✓ company.png criado');
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

generateImages();
