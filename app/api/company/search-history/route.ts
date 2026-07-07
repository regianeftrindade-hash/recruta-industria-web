import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth.config'

import { prisma } from '@/lib/db'

import { getCompanyPlanContext } from '@/lib/company-plan'

import { listCompanySearchHistory } from '@/lib/company-storage'



export async function GET() {

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

    if (!planContext.features.canSearchHistory) {

      return NextResponse.json({ error: 'Histórico disponível a partir do plano Basic.' }, { status: 403 })

    }



    const history = await listCompanySearchHistory(user.id)



    return NextResponse.json({

      history: history.map((h) => ({

        id: h.id,

        filters: JSON.parse(h.filtersJSON),

        createdAt: h.createdAt.toISOString(),

      })),

    })

  } catch (error) {

    console.error('Erro ao buscar histórico:', error)

    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })

  }

}

