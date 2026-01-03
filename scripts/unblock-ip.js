#!/usr/bin/env node

/**
 * Script para desbloquear IP bloqueado
 * Uso: node scripts/unblock-ip.js [IP_ADDRESS]
 * 
 * Exemplo:
 * node scripts/unblock-ip.js 127.0.0.1
 * node scripts/unblock-ip.js ::1
 */

const http = require('http');

const args = process.argv.slice(2);
const ipToUnblock = args[0];

if (!ipToUnblock) {
  console.error('❌ IP não fornecido!');
  console.log('\nUso: node scripts/unblock-ip.js <IP_ADDRESS>');
  console.log('\nExemplo:');
  console.log('  node scripts/unblock-ip.js 127.0.0.1');
  console.log('  node scripts/unblock-ip.js ::1\n');
  process.exit(1);
}

console.log(`🔓 Desbloqueando IP: ${ipToUnblock}\n`);

const data = JSON.stringify({ ip: ipToUnblock });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/unblock-ip',
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
