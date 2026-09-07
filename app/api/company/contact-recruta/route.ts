import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { getRecrutaSupportEmail, isEmailConfigured, sendEmail } from '@/lib/email'
import {
  COMPANY_DASHBOARD_HEADER,
  COMPANY_DASHBOARD_HEADER_VALUE,
} from '@/lib/admin/company-dashboard-mail'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })
    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const planContext = await getCompanyPlanContext(user.id)
    if (!planContext.features.canContactRecruta) {
      return NextResponse.json({
        error: 'Caixa de contato disponível a partir do plano Basic.',
        upgradeRequired: 'BASIC',
      }, { status: 403 })
    }

    const body = await request.json()
    const subject = String(body.subject || '').trim()
    const message = String(body.message || '').trim()

    if (subject.length < 3) {
      return NextResponse.json({ error: 'Informe um assunto (mín. 3 caracteres).' }, { status: 400 })
    }
    if (message.length < 5) {
      return NextResponse.json({ error: 'Escreva a mensagem (mín. 5 caracteres).' }, { status: 400 })
    }
    if (subject.length > 120 || message.length > 4000) {
      return NextResponse.json({ error: 'Assunto ou mensagem muito longos.' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.id },
      select: {
        name: true,
        cnpj: true,
        telefone: true,
        emailCorporativo: true,
        responsavelNome: true,
      },
    })

    const replyTo = (
      company?.emailCorporativo
      || user.email
      || ''
    ).trim()

    const to = getRecrutaSupportEmail()
    const planLabel = planContext.tier
    const mailSubject = `[Empresa ${planLabel}] ${subject}`

    const text = [
      'Nova mensagem da empresa via painel Recruta Indústria',
      '',
      `Empresa: ${company?.name || '—'}`,
      `CNPJ: ${company?.cnpj || '—'}`,
      `Responsável: ${company?.responsavelNome || '—'}`,
      `Telefone: ${company?.telefone || '—'}`,
      `E-mail login: ${user.email}`,
      `E-mail corporativo: ${company?.emailCorporativo || '—'}`,
      `Plano: ${planLabel}`,
      '',
      `Assunto: ${subject}`,
      '',
      'Mensagem:',
      message,
    ].join('\n')

    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#222">
        <h2 style="margin:0 0 12px;color:#8D6B1F">Mensagem da empresa (plano ${planLabel})</h2>
        <p style="margin:0 0 8px"><strong>Empresa:</strong> ${escapeHtml(company?.name || '—')}</p>
        <p style="margin:0 0 8px"><strong>CNPJ:</strong> ${escapeHtml(company?.cnpj || '—')}</p>
        <p style="margin:0 0 8px"><strong>Responsável:</strong> ${escapeHtml(company?.responsavelNome || '—')}</p>
        <p style="margin:0 0 8px"><strong>Telefone:</strong> ${escapeHtml(company?.telefone || '—')}</p>
        <p style="margin:0 0 8px"><strong>E-mail login:</strong> ${escapeHtml(user.email)}</p>
        <p style="margin:0 0 8px"><strong>E-mail corporativo:</strong> ${escapeHtml(company?.emailCorporativo || '—')}</p>
        <p style="margin:0 0 16px"><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
        <div style="padding:12px;border:1px solid #ddd;border-radius:8px;background:#fafafa;white-space:pre-wrap">${escapeHtml(message)}</div>
        <p style="margin:16px 0 0;font-size:12px;color:#666">Responda este e-mail para falar direto com a empresa (${escapeHtml(replyTo || 'sem reply-to')}).</p>
      </div>
    `

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[contact-recruta] SMTP ausente — mensagem registrada no log:', text)
        return NextResponse.json({
          success: true,
          delivered: false,
          warning: 'SMTP não configurado: mensagem só foi registrada no log do servidor (dev).',
        })
      }
      return NextResponse.json({
        error: 'Envio de e-mail não configurado no servidor. Tente novamente mais tarde.',
      }, { status: 503 })
    }

    const sent = await sendEmail({
      to,
      subject: mailSubject,
      html,
      text,
      replyTo: replyTo || undefined,
      headers: {
        [COMPANY_DASHBOARD_HEADER]: COMPANY_DASHBOARD_HEADER_VALUE,
      },
    })

    if (!sent) {
      return NextResponse.json({ error: 'Não foi possível enviar a mensagem. Tente novamente.' }, { status: 502 })
    }

    return NextResponse.json({ success: true, delivered: true, to })
  } catch (error) {
    console.error('Erro ao enviar contato Recruta:', error)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
