import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { isValidCNPJ, isValidCPF, formatCPF } from '@/lib/security'
import {
  findCompanyByCnpj,
  findCompanyByResponsavelCpf,
  saveCompanyExtraData,
} from '@/lib/company-storage'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const data = await request.json()
    const nome = String(data.nome || data.name || '').trim()
    const responsavelNome = String(data.responsavelNome || '').trim()
    const cnpjLimpo = String(data.cnpj || '').replace(/\D/g, '')
    const cpfLimpo = String(data.responsavelCpf || data.cpf || '').replace(/\D/g, '')

    if (!nome) {
      return NextResponse.json({ error: 'Informe a razão social da empresa.' }, { status: 400 })
    }

    if (!responsavelNome) {
      return NextResponse.json({ error: 'Informe o nome da pessoa responsável.' }, { status: 400 })
    }

    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      return NextResponse.json({ error: 'Informe um CNPJ válido (14 dígitos).' }, { status: 400 })
    }

    if (!isValidCNPJ(cnpjLimpo)) {
      return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 })
    }

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'Informe um CPF válido (11 dígitos).' }, { status: 400 })
    }

    if (!isValidCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const cnpjEmUso = await findCompanyByCnpj(cnpjLimpo, user.id)
    if (cnpjEmUso) {
      return NextResponse.json({ error: 'CNPJ já cadastrado em outra conta.' }, { status: 409 })
    }

    const cpfEmUso = await findCompanyByResponsavelCpf(cpfLimpo, user.id)
    if (cpfEmUso) {
      return NextResponse.json({ error: 'CPF do responsável já cadastrado em outra conta.' }, { status: 409 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: responsavelNome,
        role: 'COMPANY',
        updatedAt: new Date(),
      },
    })

    const company = await prisma.company.upsert({
      where: { userId: user.id },
      update: { name: nome },
      create: {
        userId: user.id,
        name: nome,
      },
    })

    await saveCompanyExtraData(user.id, {
      cnpj: cnpjLimpo,
      responsavelNome,
      responsavelCpf: cpfLimpo,
    })

    return NextResponse.json({
      success: true,
      message: 'Cadastro atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
      company: {
        id: company.id,
        name: company.name,
        cnpj: cnpjLimpo,
        responsavelNome,
        responsavelCpf: formatCPF(cpfLimpo),
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar cadastro:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: 'Erro ao atualizar cadastro', detail: message }, { status: 500 })
  }
}
