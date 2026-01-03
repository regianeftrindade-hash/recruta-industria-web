#!/usr/bin/env node

/**
 * Script para resetar rate limit bloqueado
 * Uso: node scripts/reset-rate-limit.js [EMAIL_OU_IP]
 * 
 * Exemplo:
 * node scripts/reset-rate-limit.js paizaonacozitha@gmail.com
 * node scripts/reset-rate-limit.js 127.0.0.1
 */

const http = require('http');

const args = process.argv.slice(2);
const identifier = args[0];

if (!identifier) {
  console.error('❌ Identificador não fornecido!');
  console.log('\nUso: node scripts/reset-rate-limit.js <EMAIL_OU_IP>');
  console.log('\nExemplo:');
  console.log('  node scripts/reset-rate-limit.js paizaonacozitha@gmail.com');
  console.log('  node scripts/reset-rate-limit.js 127.0.0.1\n');
  process.exit(1);
}

console.log(`🔓 Resetando rate limit para: ${identifier}\n`);

const data = JSON.stringify({ identifier });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/reset-rate-limit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      if (res.statusCode === 200) {
        console.log('✅ Sucesso!');
        console.log(`   ${parsed.message}\n`);
        console.log('💡 Agora você pode tentar fazer login novamente.\n');
      } else {
        console.error(`❌ Erro: ${parsed.error}\n`);
      }
    } catch (e) {
      console.error('❌ Erro ao processar resposta:', responseData, '\n');
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao conectar ao servidor:');
  console.error(`   Certifique-se de que o servidor está rodando em http://localhost:3000\n`);
  console.error('   Erro:', error.message, '\n');
  console.log('💡 Dica: Se o servidor não está rodando, execute:');
  console.log('   npm run dev\n');
  process.exit(1);
});

req.write(data);
req.end();
