import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { lerCampoJsonDoPerfil } from "@/lib/profile-json-fields";
import { parseTesteComportamentalJSON } from "@/lib/teste-comportamental";

export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: { select: { id: true, userId: true } } },
    });
    if (!user || user.role !== "PROFESSIONAL" || !user.profile) {
      return NextResponse.json({ error: "Acesso restrito a profissionais" }, { status: 403 });
    }

    const profileId = user.profile.id;

    const [proposalRows, trackingRows, testeRaw] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ propostas: bigint }>>(
        `SELECT COUNT(*)::bigint AS propostas
         FROM "JobProposal" p
         WHERE p."profileId" = $1`,
        profileId,
      ).catch(() => [{ propostas: BigInt(0) }]),
      prisma.$queryRawUnsafe<
        Array<{
          entrevistas: bigint;
          testes: bigint;
          contratacoes: bigint;
          naoContratacoes: bigint;
        }>
      >(
        `SELECT
           COUNT(*) FILTER (WHERE entrevistado = true)::bigint AS entrevistas,
           COUNT(*) FILTER (WHERE "emTeste" = true)::bigint AS testes,
           COUNT(*) FILTER (WHERE contratado = true)::bigint AS contratacoes,
           COUNT(*) FILTER (WHERE "naoContratado" = true)::bigint AS "naoContratacoes"
         FROM "CompanyProfileTracking"
         WHERE "profileId" = $1`,
        profileId,
      ).catch(() => [
        {
          entrevistas: BigInt(0),
          testes: BigInt(0),
          contratacoes: BigInt(0),
          naoContratacoes: BigInt(0),
        },
      ]),
      lerCampoJsonDoPerfil(user.id, "testeComportamentalJSON"),
    ]);

    const testeComportamental = parseTesteComportamentalJSON(testeRaw);
    const propostas = Number(proposalRows[0]?.propostas || 0);
    const entrevistas = Number(trackingRows[0]?.entrevistas || 0);
    const testesEmpresas = Number(trackingRows[0]?.testes || 0);
    const contratacoes = Number(trackingRows[0]?.contratacoes || 0);
    const naoContratacoes = Number(trackingRows[0]?.naoContratacoes || 0);
    const testes = testesEmpresas + (testeComportamental ? 1 : 0);

    return NextResponse.json({
      history: {
        propostas,
        entrevistas,
        testes,
        contratacoes,
        naoContratacoes,
        testeComportamental: Boolean(testeComportamental),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar histórico do profissional:", error);
    return NextResponse.json({ error: "Erro ao carregar histórico" }, { status: 500 });
  }
}
