"use client";

import React from "react";
import { DASH, dashCard, dashInnerBox, dashPlanAccent, dashSectionTitle } from "@/lib/dashboard-theme";

const blockStyle: React.CSSProperties = {
  margin: 0,
  padding: 10,
  boxSizing: "border-box",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.15cm",
  ...dashInnerBox,
  borderRadius: 14,
};

const titleStyle: React.CSSProperties = {
  ...dashSectionTitle,
  margin: 0,
  fontSize: 12,
  lineHeight: 1.25,
};

const textStyle: React.CSSProperties = {
  color: DASH.muted,
  margin: 0,
  fontSize: 11,
  lineHeight: 1.3,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 14,
  fontSize: 11,
  color: DASH.text,
  lineHeight: 1.3,
};

const planTag: React.CSSProperties = {
  display: "inline-block",
  margin: 0,
  fontSize: 9,
  lineHeight: 1.2,
  ...dashPlanAccent,
  fontWeight: "bold",
};

function FeatureSection({
  emoji,
  title,
  description,
  subtitle,
  items,
  plano,
}: {
  emoji: string;
  title: string;
  description?: string;
  subtitle?: string;
  items: string[];
  plano?: string;
}) {
  return (
    <div style={blockStyle}>
      <p style={titleStyle}>{emoji} {title}</p>
      {description && <p style={textStyle}>{description}</p>}
      {subtitle && <p style={textStyle}>{subtitle}</p>}
      {items.length > 0 && (
        <ul style={listStyle}>
          {items.map((item) => (
            <li key={item} style={{ margin: 0, padding: 0 }}>{item}</li>
          ))}
        </ul>
      )}
      {plano && <span style={planTag}>Plano: {plano}</span>}
    </div>
  );
}

export default function CompanyExclusiveFeatures({
  layout = "stack",
}: {
  layout?: "stack" | "horizontal";
}) {
  const horizontal = layout === "horizontal";

  return (
    <div
      data-card="1"
      className="dash-card"
      style={{
        ...dashCard,
        padding: 12,
      }}
    >
      <h3
        style={{
          ...dashSectionTitle,
          ...dashPlanAccent,
          margin: "0 0 2px",
          fontSize: horizontal ? 14 : 13,
          lineHeight: 1.25,
          fontWeight: 800,
        }}
      >
        Recursos do Recruta Indústria
      </h3>
      <p style={{ color: DASH.text, margin: "0 0 0.5cm", fontSize: horizontal ? 11 : 10, lineHeight: 1.3 }}>
        Ferramentas disponíveis hoje na plataforma para buscar e analisar profissionais da indústria.
        Os planos acumulam: Basic inclui o Free; Premium inclui o Basic; Empresarial inclui o Premium.
      </p>

      <div
        style={
          horizontal
            ? {
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.5cm",
                alignItems: "start",
              }
            : {
                display: "flex",
                flexDirection: "column",
                gap: "0.5cm",
              }
        }
      >
        <FeatureSection
          emoji="🔍"
          title="Busca e perfil resumido"
          description="Pesquise profissionais e veja dados parciais antes de liberar o contato."
          items={[
            "Filtros básicos: estado, cidade, área e cargo",
            "Experiência, formação e habilidades principais",
            "Segmentos e equipamentos (visão resumida)",
          ]}
          plano="Free+"
        />

        <FeatureSection
          emoji="🎯"
          title="Índice de compatibilidade"
          description="Ao buscar com filtros, cada perfil recebe uma pontuação de compatibilidade e os resultados são ordenados do mais compatível para o menos compatível."
          subtitle="No Free usa filtros básicos; no Basic+ também entra na pontuação o que você filtrar nos avançados."
          items={[
            "Cargo, área e experiência",
            "Segmento industrial e máquinas",
            "Turno, localização e pretensão salarial",
            "CNH, viagens e disponibilidade para mudança",
          ]}
          plano="Todos os planos"
        />

        <FeatureSection
          emoji="🏭"
          title="Plataforma para a indústria"
          description="Cadastro detalhado do profissional, busca com filtros industriais e liberação controlada de contatos conforme o plano da empresa."
          items={[]}
          plano="Todos os planos"
        />

        <FeatureSection
          emoji="⚙️"
          title="Filtros industriais avançados"
          description="Refine a busca com critérios específicos do setor industrial."
          subtitle="Filtros disponíveis:"
          items={[
            "Escolaridade, situação profissional e nível operacional",
            "Turno, disponibilidade de início e tempo de experiência",
            "Segmento industrial, máquinas, qualidade e informática/ERP",
            "CNH, categoria, viagens, mudança e idioma",
            "Curso/certificação, área do curso e pretensão salarial",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="🔓"
          title="Liberação de contatos"
          description="Desbloqueie o perfil completo para ver telefone, e-mail, WhatsApp, currículo e demais informações cadastradas."
          items={[
            "Basic: até 50 liberações por mês",
            "Premium e Empresarial: liberações ilimitadas",
            "Exige e-mail corporativo confirmado e cartão CNPJ aprovado",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="⭐"
          title="Perfil completo desbloqueado"
          description="Após liberar o contato, você acessa as informações cadastradas pelo profissional."
          subtitle="Inclui, quando informado no cadastro:"
          items={[
            "Contatos, escolaridade e pretensão salarial",
            "Cursos, certificações e idiomas",
            "Experiências, segmentos e máquinas operadas",
            "Qualidade, informática, CNH e viagens",
            "Currículo, anexos e vídeo de apresentação",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="💡"
          title="Dicas anônimas para profissionais"
          description="Envie sugestões anônimas para ajudar o profissional a melhorar o perfil. O profissional visualiza as dicas no painel dele."
          items={[]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="📌"
          title="Favoritos e histórico de buscas"
          description="Salve profissionais para consultar depois e acompanhe as pesquisas já feitas na plataforma."
          items={[
            "Basic: até 100 favoritos",
            "Premium e Empresarial: favoritos ilimitados",
            "Histórico de pesquisas a partir do Basic",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="📊"
          title="Dashboard de recrutamento"
          description="Acompanhe números da sua atividade na plataforma."
          items={[
            "Perfis favoritados",
            "Pesquisas realizadas",
            "Liberações do mês",
            "Alertas configurados",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="📬"
          title="Contato Recruta Indústria"
          description="Caixa de mensagem aberta no painel: a empresa escreve e a mensagem chega direto no e-mail da Recruta Indústria."
          items={[
            "Disponível em Basic, Premium e Empresarial",
            "Não incluso no plano Free",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="👥"
          title="Equipe RH na mesma assinatura"
          description="O Administrador Principal convida usuários do RH. Cada um entra no login de empresas com e-mail e senha próprios e acessa o painel da mesma empresa."
          items={[
            "Basic: 1 usuário incluso (extras pagos)",
            "Premium: até 2 usuários inclusos",
            "Empresarial: até 4 usuários inclusos",
            "Adicionar, remover e trocar usuários sem comprar outro plano",
            "Chat e convite na videochamada só entre quem está no mesmo plano",
          ]}
          plano="Basic+ (assentos conforme o plano)"
        />

        <FeatureSection
          emoji="📅"
          title="Propostas, entrevistas e videochamada"
          description="Envie propostas, agende entrevistas e chame o candidato pela videochamada da plataforma."
          items={[
            "Propostas de entrevista",
            "Agenda de entrevistas no painel",
            "Videochamada com o profissional",
            "Convite de colegas da equipe (assinatura compartilhada)",
          ]}
          plano="Basic+"
        />

        <FeatureSection
          emoji="🔔"
          title="Alertas de talentos"
          description="Salve combinações de filtros como alerta e consulte no painel quando houver novos profissionais compatíveis nos últimos 30 dias."
          items={[]}
          plano="Premium+"
        />

        <FeatureSection
          emoji="📄"
          title="Exportação de perfil"
          description="Gere um arquivo para impressão ou salvamento com os dados do profissional desbloqueado."
          items={[]}
          plano="Premium+"
        />

        <FeatureSection
          emoji="📁"
          title="Banco de talentos"
          description="Organize profissionais desbloqueados em listas (ex.: Operadores CNC, Qualidade, PCP) para consultas futuras."
          items={[
            "Listas padrão criadas automaticamente",
            "Possibilidade de criar novas listas",
          ]}
          plano="Empresarial"
        />
      </div>
    </div>
  );
}
