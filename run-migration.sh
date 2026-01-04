#!/bin/bash
# Script para executar migration do Prisma

echo "🔧 Executando migration do Prisma..."
echo "Nome: add-verifications-and-payments"
echo ""

cd c:/Projetos/recruta-industria/recruta-industria-web

# Executar migration
npx prisma migrate dev --name add-verifications-and-payments

echo ""
echo "✅ Migration completa!"
echo ""
echo "Tabelas criadas:"
echo "- EmailVerification (para códigos de verificação de email)"
echo "- PaymentRecord (para histórico de pagamentos)"
echo ""
echo "Próximo passo:"
echo "1. git add ."
echo "2. git commit -m 'feat: adicionar migration para verificação de email e pagamentos'"
echo "3. git push origin main"
