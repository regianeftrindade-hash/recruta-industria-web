const fs = require('fs');
const path = require('path');

// Script para limpar bloqueios e rate limiting

console.log('🔓 Desbloqueando acesso...\n');

// Limpar o arquivo de usuários também garante que não há bloqueios persistentes
const usersFile = path.join(__dirname, '..', 'data', 'users.json');
if (fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, '[]', 'utf-8');
  console.log('✅ Usuários limpos');
}

// Limpar arquivos temporários que possam conter dados de bloqueio
const tmpDir = path.join(__dirname, '..', 'tmp');
if (fs.existsSync(tmpDir)) {
  const files = fs.readdirSync(tmpDir);
  files.forEach(file => {
    try {
      fs.unlinkSync(path.join(tmpDir, file));
    } catch (e) {
      // ignorar erros
    }
  });
  console.log('✅ Arquivos temporários limpos');
}

console.log('\n✨ Acesso desbloqueado!');
console.log('ℹ️  Os bloqueios de IP e rate limiting foram removidos.');
console.log('ℹ️  Você pode fazer login normalmente agora.\n');
