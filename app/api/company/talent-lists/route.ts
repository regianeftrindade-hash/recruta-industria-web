import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import {
  addProfileToTalentList,
  createTalentList,
  deleteTalentList,
  listTalentListIdsForProfile,
  listTalentListProfileIds,
  listTalentLists,
  listTalentListsWithProfiles,
  removeProfileFromTalentList,
  seedDefaultTalentLists,
  syncProfileTalentLists,
} from '@/lib/company-features-db'

export async function GET(request: NextRequest) {
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
    if (!planContext.features.canUseTalentBank) {
      return NextResponse.json({ error: 'Banco de talentos disponível no plano Empresarial.' }, { status: 403 })
    }

    await seedDefaultTalentLists(user.id)

    const { searchParams } = new URL(request.url)

    if (searchParams.get('include') === 'profiles') {
      const listsWithProfiles = await listTalentListsWithProfiles(user.id)
      return NextResponse.json({
        lists: listsWithProfiles.map((l) => ({
          id: l.id,
          name: l.name,
          itemCount: l.profiles.length,
          profiles: l.profiles,
          createdAt: l.createdAt.toISOString(),
        })),
      })
    }

    const lists = await listTalentLists(user.id)
    const listId = searchParams.get('listId')
    if (listId) {
      const profileIds = await listTalentListProfileIds(listId, user.id)
      return NextResponse.json({ profileIds })
    }

    const profileId = searchParams.get('profileId')
    const membershipListIds = profileId
      ? await listTalentListIdsForProfile(user.id, profileId)
      : []

    return NextResponse.json({
      lists: lists.map((l) => ({
        id: l.id,
        name: l.name,
        itemCount: Number(l.itemCount),
        createdAt: l.createdAt.toISOString(),
      })),
      membershipListIds,
    })
  } catch (error) {
    console.error('Erro ao listar banco de talentos:', error)
    return NextResponse.json({ error: 'Erro ao listar banco de talentos' }, { status: 500 })
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
    if (!planContext.features.canUseTalentBank) {
      return NextResponse.json({ error: 'Banco de talentos disponível no plano Empresarial.' }, { status: 403 })
    }

    const body = await request.json()
    const action = body.action as string

    if (action === 'createList') {
      const name = String(body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Informe o nome da lista' }, { status: 400 })
      const id = await createTalentList(user.id, name)
      return NextResponse.json({ success: true, id })
    }

    if (action === 'addProfile') {
      const { listId, profileId } = body
      if (!listId || !profileId) {
        return NextResponse.json({ error: 'Lista e perfil são obrigatórios' }, { status: 400 })
      }
      await addProfileToTalentList(user.id, listId, profileId)
      return NextResponse.json({ success: true })
    }

    if (action === 'syncProfileLists') {
      const profileId = String(body.profileId || '').trim()
      const listIds = Array.isArray(body.listIds)
        ? body.listIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
        : []
      if (!profileId) {
        return NextResponse.json({ error: 'Perfil é obrigatório' }, { status: 400 })
      }
      await syncProfileTalentLists(user.id, profileId, listIds)
      const membershipListIds = await listTalentListIdsForProfile(user.id, profileId)
      return NextResponse.json({ success: true, membershipListIds })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro no banco de talentos:', error)
    return NextResponse.json({ error: 'Erro no banco de talentos' }, { status: 500 })
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
    const listId = searchParams.get('listId')
    const profileId = searchParams.get('profileId')

    if (listId && profileId) {
      await removeProfileFromTalentList(user.id, listId, profileId)
      return NextResponse.json({ success: true })
    }

    if (listId) {
      await deleteTalentList(user.id, listId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao remover do banco de talentos:', error)
    return NextResponse.json({ error: 'Erro ao remover do banco de talentos' }, { status: 500 })
  }
}
