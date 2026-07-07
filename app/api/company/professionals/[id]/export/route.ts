import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { parseProfileIndustrial } from '@/lib/profile-industrial'

function esc(value: unknown): string {
  return String(value ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    if (!planContext.features.canExportProfiles) {
      return NextResponse.json({ error: 'Exportação disponível a partir do plano Premium.' }, { status: 403 })
    }

    const { id: profileId } = await params
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: user.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    if (!unlocked && !planContext.features.canViewContacts) {
      return NextResponse.json({ error: 'Desbloqueie o perfil para exportar.' }, { status: 403 })
    }

    const industrial = parseProfileIndustrial(profile)
    const nome = profile.user.name || 'Profissional'
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Perfil — ${esc(nome)}</title>
  <style>
    body { font-family: Oswald, "Bebas Neue", Impact, sans-serif; letter-spacing: 1px; color: #111; max-width: 800px; margin: 24px auto; line-height: 1.5; }
    h1 { color: #8D6B1F; border-bottom: 2px solid #C89B3C; padding-bottom: 8px; }
    h2 { color: #8D6B1F; font-size: 16px; margin-top: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
    .val { margin-bottom: 8px; }
    ul { margin: 4px 0 0 18px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${esc(nome)}</h1>
  <p><strong>Cargo desejado:</strong> ${esc(profile.cargoDesejado || profile.title)}</p>
  <p><strong>Área:</strong> ${esc(profile.areaInteresse)}</p>
  <p><strong>Local:</strong> ${esc(profile.cidade)}${profile.estado ? `, ${esc(profile.estado)}` : ''}</p>

  <h2>Contato</h2>
  <div class="grid">
    <div><div class="label">E-mail</div><div class="val">${esc(profile.email || profile.user.email)}</div></div>
    <div><div class="label">Telefone</div><div class="val">${esc(profile.phone)}</div></div>
    <div><div class="label">WhatsApp</div><div class="val">${esc(profile.whatsapp)}</div></div>
    <div><div class="label">Disponibilidade</div><div class="val">${esc(industrial.disponivelContratacao || profile.disponibilidadeInicio)}</div></div>
  </div>

  <h2>Formação e qualificações</h2>
  <p><strong>Escolaridade:</strong> ${esc(profile.escolaridade)}</p>
  <p><strong>Cursos:</strong></p><ul>${industrial.cursos.map((c) => `<li>${esc(c)}</li>`).join('') || '<li>—</li>'}</ul>
  <p><strong>Certificações:</strong></p><ul>${industrial.certificacoes.map((c) => `<li>${esc(c)}</li>`).join('') || '<li>—</li>'}</ul>
  <p><strong>Idiomas:</strong></p><ul>${industrial.idiomas.map((c) => `<li>${esc(c)}</li>`).join('') || '<li>—</li>'}</ul>

  <h2>Experiência industrial</h2>
  <p><strong>Tempo de experiência:</strong> ${esc(profile.tempoExperiencia)}</p>
  <p><strong>Segmentos:</strong> ${esc(industrial.segmentosIndustria.join(', '))}</p>
  <p><strong>Máquinas/equipamentos:</strong> ${esc(industrial.maquinasEquipamentos.join(', '))}</p>
  <p><strong>Qualidade:</strong> ${esc(industrial.qualidadeProcessos.join(', '))}</p>
  <p><strong>Informática/ERP:</strong> ${esc(industrial.informatica.join(', '))}</p>
  <p><strong>Histórico:</strong></p>
  <ul>${industrial.empresas.map((e) => `<li>${esc(e.cargo)} — ${esc(e.nome)}</li>`).join('') || '<li>—</li>'}</ul>

  <h2>Condições</h2>
  <div class="grid">
    <div><div class="label">Turno</div><div class="val">${esc(profile.turnoDisponivel)}</div></div>
    <div><div class="label">Pretensão salarial</div><div class="val">${esc(profile.pretensaoSalarial)}</div></div>
    <div><div class="label">CNH</div><div class="val">${esc(industrial.possuiCNH)} ${industrial.categoriaCNH ? `(${esc(industrial.categoriaCNH)})` : ''}</div></div>
    <div><div class="label">Aceita viagens</div><div class="val">${esc(industrial.aceitaViagens)}</div></div>
    <div><div class="label">Disponível para mudança</div><div class="val">${esc(industrial.disponibilidadeMudanca)}</div></div>
  </div>

  <h2>Apresentação</h2>
  <p>${esc(profile.mensagemEmpresas || profile.bio)}</p>

  <p style="margin-top:32px;font-size:11px;color:#888;">Exportado em ${new Date().toLocaleString('pt-BR')} — Recruta Indústria</p>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="perfil-${nome.replace(/\s+/g, '-').toLowerCase()}.html"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar perfil:', error)
    return NextResponse.json({ error: 'Erro ao exportar perfil' }, { status: 500 })
  }
}
