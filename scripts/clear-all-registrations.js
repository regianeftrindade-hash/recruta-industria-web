#!/usr/bin/env node

/**
 * Limpa todos os cadastros de profissionais e empresas.
 * Preserva usuários com role ADMIN.
 *
 * Uso: node scripts/clear-all-registrations.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function safeRawDelete(label, sql) {
  try {
    const count = await prisma.$executeRawUnsafe(sql);
    console.log(`✓ ${label}: ${count}`);
    return count;
  } catch (error) {
    if (error?.code === 'P2010' || String(error?.message || '').includes('does not exist')) {
      console.log(`○ ${label}: tabela ausente (ignorado)`);
      return 0;
    }
    throw error;
  }
}

async function clearAllRegistrations() {
  try {
    console.log('🧹 Limpando cadastros (profissionais e empresas)...\n');

    const payments = await prisma.paymentRecord.deleteMany();
    console.log(`✓ Pagamentos removidos: ${payments.count}`);

    const tips = await prisma.tip.deleteMany();
    console.log(`✓ Dicas removidas: ${tips.count}`);

    const access = await prisma.accessRecord.deleteMany();
    console.log(`✓ Acessos removidos: ${access.count}`);

    const views = await prisma.profileView.deleteMany();
    console.log(`✓ Visualizações removidas: ${views.count}`);

    await safeRawDelete('Itens de banco de talentos removidos', `DELETE FROM "CompanyTalentListItem"`);
    await safeRawDelete('Listas de talentos removidas', `DELETE FROM "CompanyTalentList"`);
    await safeRawDelete('Alertas removidos', `DELETE FROM "CompanyAlert"`);
    await safeRawDelete('Favoritos removidos', `DELETE FROM "CompanyFavorite"`);
    await safeRawDelete('Histórico de buscas removido', `DELETE FROM "CompanySearchHistory"`);

    const profiles = await prisma.profile.deleteMany();
    console.log(`✓ Perfis profissionais removidos: ${profiles.count}`);

    const companies = await prisma.company.deleteMany();
    console.log(`✓ Empresas removidas: ${companies.count}`);

    const professionals = await prisma.professional.deleteMany();
    console.log(`✓ Registros Professional removidos: ${professionals.count}`);

    const verifications = await prisma.emailVerification.deleteMany();
    console.log(`✓ Verificações de e-mail removidas: ${verifications.count}`);

    const users = await prisma.user.deleteMany({
      where: {
        role: { in: ['COMPANY', 'PROFESSIONAL'] },
      },
    });
    console.log(`✓ Usuários (empresa/profissional) removidos: ${users.count}`);

    const remaining = await prisma.user.count();
    console.log(`\n✅ Limpeza concluída. Usuários restantes no banco: ${remaining}`);
    console.log('   (contas ADMIN foram preservadas, se existirem)\n');
    console.log('💡 No navegador, limpe o localStorage ou use aba anônima antes de cadastrar de novo.');
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllRegistrations();
