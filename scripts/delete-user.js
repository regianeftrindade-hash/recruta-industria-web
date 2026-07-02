#!/usr/bin/env node

/**
 * 🧹 Script para deletar usuário do banco de dados
 * ==================================================
 * 
 * Uso: node scripts/delete-user.js re.ftm89@gmail.com
 * 
 * Conecta ao banco PostgreSQL (Vercel/Supabase) e deleta um usuário
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser(email) {
  if (!email) {
    console.error('❌ Email é obrigatório');
    console.log('Uso: node scripts/delete-user.js seu-email@exemplo.com');
    process.exit(1);
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`🔍 Procurando usuário: ${normalizedEmail}`);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        company: true,
        professional: true,
      },
    });

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${normalizedEmail}`);
      process.exit(1);
    }

    console.log(`✓ Usuário encontrado:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Nome: ${user.name}`);
    console.log(`  - Tipo: ${user.role}`);

    // Confirmar deleção
    console.log('\n⚠️  AVISO: Esta ação vai deletar o usuário permanentemente!');
    console.log('Continuando em 3 segundos...\n');

    // Deletar dados relacionados primeiro
    if (user.profile) {
      await prisma.profile.delete({
        where: { id: user.profile.id },
      });
      console.log('✓ Perfil deletado');
    }

    if (user.company) {
      await prisma.company.delete({
        where: { id: user.company.id },
      });
      console.log('✓ Empresa deletada');
    }

    if (user.professional) {
      await prisma.professional.delete({
        where: { id: user.professional.id },
      });
      console.log('✓ Profissional deletado');
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`\n✅ Usuário ${normalizedEmail} deletado com sucesso!`);
    console.log('   Agora você pode se registrar novamente com este email.\n');
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
deleteUser(email);
