"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CompanyPlanCards from "@/app/components/CompanyPlanCards";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";
import { getPlanDefinition } from "@/lib/company-premium-plans";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashInnerBox,
  dashPlanAccent,
  dashSectionTitle,
} from "@/lib/dashboard-theme";

type ManualSection = {
  id: string;
  emoji: string;
  titulo: string;
  planos: string;
  passos: string[];
  dicas?: string[];
};

const MANUAL: ManualSection[] = [
  {
    id: "inicio",
    emoji: "🏠",
    titulo: "Início — busca e vitrine de perfis",
    planos: "Todos os planos (Free com visão resumida)",
    passos: [
      "Na aba Início, use a Busca rápida (cargo, estado, cidade, experiência e turno) para encontrar profissionais da indústria.",
      "Clique em Busca Avançada para abrir os demais filtros (área, máquinas, CNH, idiomas etc.).",
      "No plano Basic ou superior, os filtros avançados ficam liberados.",
      "A vitrine mostra cards com compatibilidade, área, cidade e experiência principal.",
      "Clique em um card para abrir o perfil completo (ou resumido, no Free).",
      "Use a paginação no rodapé da vitrine para navegar entre as páginas de resultados.",
      "Marque favoritos (bandeira) nos planos pagos para acompanhar candidatos depois.",
    ],
    dicas: [
      "Quanto mais filtros específicos, mais preciso fica o índice de compatibilidade.",
      "No Free você explora a base; para ver contatos e currículo completo, é preciso plano pago e empresa verificada.",
    ],
  },
  {
    id: "perfil",
    emoji: "👤",
    titulo: "Perfil do candidato",
    planos: "Basic+ para contatos e currículo; Free só resumo",
    passos: [
      "Abra um profissional na vitrine. O cabeçalho mostra nome, cargo, status online e favorito.",
      "Plano pago + empresa verificada: use Liberar contato para desbloquear telefone, e-mail, WhatsApp, currículo e vídeo.",
      "No Basic há limite mensal de liberações (150/mês). No Premium e Empresarial as liberações são ilimitadas.",
      "Assista ao vídeo de apresentação e use a chamada de vídeo pela plataforma para entrevistar.",
      "Colegas do mesmo plano, com o mesmo perfil aberto, recebem convite com Aceitar/Recusar e podem entrar na chamada.",
      "Use Compartilhar (abaixo da videochamada) para enviar o perfil a outros usuários da sua assinatura.",
      "Na coluna da direita: propostas/entrevistas, feedback da equipe, mensagens, banco de talentos, dicas e acompanhamento.",
    ],
    dicas: [
      "Feedback da equipe fica visível para todos da mesma assinatura — use para alinhar a decisão de contratação.",
      "Acompanhamento (Contatado, Entrevistado, Em teste, Contratado) e anotações são só da sua empresa.",
    ],
  },
  {
    id: "video",
    emoji: "📹",
    titulo: "Videochamada e entrevistas",
    planos: "Basic+",
    passos: [
      "No perfil desbloqueado, clique em Chamar na área de chamada de vídeo.",
      "O profissional recebe o toque e pode Aceitar ou Recusar.",
      "Após aceitar, a câmera liga dos dois lados. Use Sobrepor para manter o vídeo fixo ao rolar a página.",
      "Quem estiver com o mesmo perfil aberto na equipe vê o convite e pode participar (até 4 da empresa).",
      "Propostas e agendamentos ficam no card Propostas e entrevistas do perfil e na aba Entrevistas.",
    ],
  },
  {
    id: "banco",
    emoji: "📁",
    titulo: "Banco de talentos",
    planos: "Premium e Empresarial",
    passos: [
      "No perfil, use Adicionar ao banco de talentos para colocar o candidato em uma ou mais listas.",
      "Crie listas personalizadas (ex.: Operadores CNC, Qualidade, Soldadores).",
      "Na aba Banco, veja as listas e abra os perfis agrupados por cargo.",
      "Clique em um nome para reabrir o perfil na vitrine.",
    ],
    dicas: [
      "Organize por processo seletivo ou área — facilita o dia a dia do RH com muitos candidatos.",
    ],
  },
  {
    id: "entrevistas-aba",
    emoji: "📅",
    titulo: "Aba Entrevistas",
    planos: "Basic+",
    passos: [
      "Quando você agenda uma entrevista a partir de uma proposta, ela aparece nesta aba.",
      "Veja data, horário, cargo e status de cada compromisso.",
      "Clique no candidato para voltar ao perfil e continuar o acompanhamento.",
    ],
  },
  {
    id: "alertas",
    emoji: "🔔",
    titulo: "Alertas de talentos",
    planos: "Premium e Empresarial",
    passos: [
      "Na aba Alertas, crie um alerta com nome e filtros (pelo menos o cargo).",
      "A plataforma avisa quando surgem profissionais compatíveis com o filtro.",
      "Ative ou pause alertas conforme a necessidade da vaga.",
      "Abra os novos matches diretamente pela lista do alerta.",
    ],
  },
  {
    id: "equipe",
    emoji: "👥",
    titulo: "Equipe RH e Chat",
    planos: "Inclusos: Basic 1 · Premium 2 · Empresarial 4 (+ extras pagos)",
    passos: [
      "O Administrador Principal gerencia a equipe: adicionar, remover e trocar usuários.",
      "Clique em Adicionar usuário e preencha Nome, E-mail e Função (RH, Recrutador ou Admin).",
      "O sistema gera um link de convite; a pessoa cria login e senha próprios em /login/empresa.",
      "Todos usam a mesma assinatura e o mesmo painel da empresa.",
      "Se o limite do plano acabar, escolha um pacote de usuários extras (1, 3 ou 5) e pague via Pix.",
      "Após o pagamento, o contador sobe (ex.: 4/5) e você cadastra o novo membro normalmente.",
      "Use Trocar para substituir alguém que saiu sem comprar outro assento.",
      "Na mesma aba Equipe, use o Chat para falar com colegas e abrir perfis compartilhados.",
    ],
    dicas: [
      "Pacotes: 1 usuário R$ 29,90/mês · 3 usuários R$ 79,90/mês · 5 usuários R$ 119,90/mês.",
      "Só entram no chat pessoas da mesma assinatura.",
    ],
  },
  {
    id: "mensagens",
    emoji: "✉️",
    titulo: "Mensagens e dicas ao candidato",
    planos: "Basic+",
    passos: [
      "No perfil, envie mensagem direta — ela chega na caixa de entrada do profissional.",
      "Acompanhe o histórico da conversa no mesmo card.",
      "Dicas são anônimas: o candidato recebe a orientação sem ver o nome da empresa.",
    ],
  },
  {
    id: "feedback",
    emoji: "🗒️",
    titulo: "Feedback da equipe",
    planos: "Mesma assinatura",
    passos: [
      "No perfil, no card Feedback da equipe, escreva sua avaliação e clique em Enviar.",
      "Todos os membros do plano veem os feedbacks salvos, com nome e data.",
      "Use para alinhar impressões depois da videoentrevista ou da análise do currículo.",
    ],
  },
  {
    id: "contato",
    emoji: "📞",
    titulo: "Contato com a Recruta Indústria",
    planos: "Basic+",
    passos: [
      "Na aba Contato Recruta, envie mensagens diretas à equipe da Recruta Indústria.",
      "Use para dúvidas de plano, verificação de CNPJ, cobrança ou suporte.",
    ],
  },
  {
    id: "verificacao",
    emoji: "✅",
    titulo: "Verificação da empresa",
    planos: "Necessário para dados sensíveis",
    passos: [
      "Confirme o e-mail corporativo e envie o cartão CNPJ no cadastro da empresa.",
      "Após aprovação, o plano pago libera contatos, currículo completo e demais recursos sensíveis.",
      "Sem verificação, mesmo com plano pago, os dados sensíveis permanecem bloqueados.",
    ],
  },
];

function ManualCard({ section, forceOpen }: { section: ManualSection; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const expanded = forceOpen || open;

  return (
    <div
      style={{
        ...dashInnerBox,
        border: `1px solid ${DASH.gold}`,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          background: expanded ? "rgba(200,155,60,0.12)" : "transparent",
          border: "none",
          color: DASH.text,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: DASH.gold }}>
          {section.emoji} {section.titulo}
        </span>
        <span style={{ fontSize: 12, color: DASH.muted, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded ? (
        <div style={{ padding: "0 14px 14px", display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>
            Disponibilidade: <strong style={{ color: DASH.gold }}>{section.planos}</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: DASH.text, lineHeight: 1.55 }}>
            {section.passos.map((p) => (
              <li key={p} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))}
          </ol>
          {section.dicas && section.dicas.length > 0 ? (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(200,155,60,0.08)",
                border: `1px dashed ${DASH.gold}`,
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: DASH.gold }}>
                Dicas
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: DASH.text, lineHeight: 1.5 }}>
                {section.dicas.map((d) => (
                  <li key={d} style={{ marginBottom: 4 }}>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Aba Meu Plano: resumo da assinatura, cards de upgrade e manual de uso.
 */
export default function CompanyMeuPlanoPage() {
  const router = useRouter();
  const [planTier, setPlanTier] = useState<CompanyPlanTier>("FREE");
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/profile", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setPlanTier((data.plan?.tier || data.planTier || "FREE") as CompanyPlanTier);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const planDef = getPlanDefinition(planTier);

  const handleSelectFree = async () => {
    try {
      const res = await fetch("/api/company/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planTier: "FREE" }),
      });
      if (res.ok) {
        setPlanTier("FREE");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível alterar o plano.");
      }
    } catch {
      alert("Erro de rede ao alterar o plano.");
    }
  };

  return (
    <main style={{ padding: "16px 24px", display: "grid", gap: 16 }}>
      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h3 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>📋 Meu Plano</h3>
        {loading ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Carregando plano...</p>
        ) : (
          <>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: DASH.gold }}>
              {planDef.emoji} Plano atual: {planDef.nome}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: DASH.text }}>
              {planDef.preco}
              <span style={{ color: DASH.muted, fontSize: 11 }}>{planDef.periodo}</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.5 }}>
              {planDef.descricao}
            </p>
          </>
        )}
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <CompanyPlanCards
          currentTier={loading ? null : planTier}
          onSelectFree={() => void handleSelectFree()}
        />
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 4px", fontSize: 15 }}>
              📖 Manual de uso da plataforma
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
              Guia detalhado de cada funcionalidade do painel da empresa. Clique em um tema para
              expandir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpandAll((v) => !v)}
            style={{
              ...btnGold,
              padding: "6px 12px",
              fontSize: 11,
              background: expandAll ? DASH.gold : "transparent",
              color: expandAll ? "#000" : DASH.gold,
              border: `1px solid ${DASH.gold}`,
              boxShadow: expandAll ? undefined : "none",
            }}
          >
            {expandAll ? "Recolher tudo" : "Expandir tudo"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {MANUAL.map((section) => (
            <ManualCard key={section.id} section={section} forceOpen={expandAll} />
          ))}
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
          Dúvidas sobre cobrança, verificação ou planos? Use a aba{" "}
          <strong style={dashPlanAccent}>Contato</strong> para falar com a Recruta Indústria.
        </p>
      </section>
    </main>
  );
}
