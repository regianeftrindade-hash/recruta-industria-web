import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth.config'

import { prisma } from '@/lib/db'

import { getCompanyPlanContext } from '@/lib/company-plan'

import {

  createCompanyFavorite,

  deleteCompanyFavorite,

  hasCompanyFavorite,

  listCompanyFavoriteProfileIds,

} from '@/lib/company-storage'

import { notifyProfessionalAsync, notifyProfileFavorited } from '@/lib/professional-notifications'



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
    const dataUserId = planContext.ownerUserId || user.id

    if (!planContext.features.canFavorite) {

      return NextResponse.json({ error: 'Favoritos disponíveis a partir do plano Basic.' }, { status: 403 })

    }



    const favorites = await listCompanyFavoriteProfileIds(dataUserId)



    return NextResponse.json({ favorites })

  } catch (error) {

    console.error('Erro ao listar favoritos:', error)

    return NextResponse.json({ error: 'Erro ao listar favoritos' }, { status: 500 })

  }

}



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
    const dataUserId = planContext.ownerUserId || user.id

    if (!planContext.features.canFavorite) {

      return NextResponse.json({ error: 'Favoritos disponíveis a partir do plano Basic.' }, { status: 403 })

    }



    const { profileId } = await request.json()

    if (!profileId) {

      return NextResponse.json({ error: 'Perfil não informado' }, { status: 400 })

    }



    const existing = await hasCompanyFavorite(dataUserId, profileId)



    if (existing) {

      return NextResponse.json({ success: true, favorited: true })

    }



    if (

      !planContext.features.unlimitedFavorites

      && planContext.usage.favoritesRemaining !== null

      && planContext.usage.favoritesRemaining <= 0

    ) {

      return NextResponse.json({

        error: 'Limite de 100 favoritos atingido. Faça upgrade para Premium.',

        upgradeRequired: 'PREMIUM',

      }, { status: 403 })

    }



    await createCompanyFavorite(dataUserId, profileId)

    notifyProfessionalAsync(() =>
      notifyProfileFavorited(profileId, user.id)
    )

    return NextResponse.json({ success: true, favorited: true })

  } catch (error) {

    console.error('Erro ao favoritar:', error)

    return NextResponse.json({ error: 'Erro ao favoritar perfil' }, { status: 500 })

  }

}



export async function DELETE(request: NextRequest) {

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



    const { searchParams } = new URL(request.url)

    const profileId = searchParams.get('profileId')

    if (!profileId) {

      return NextResponse.json({ error: 'Perfil não informado' }, { status: 400 })

    }



    const planContext = await getCompanyPlanContext(user.id)
    const dataUserId = planContext.ownerUserId || user.id
    await deleteCompanyFavorite(dataUserId, profileId)



    return NextResponse.json({ success: true })

  } catch (error) {

    console.error('Erro ao remover favorito:', error)

    return NextResponse.json({ error: 'Erro ao remover favorito' }, { status: 500 })

  }

}

