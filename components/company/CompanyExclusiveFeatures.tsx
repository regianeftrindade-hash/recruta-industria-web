"use client";



import React from "react";

import { DASH, dashInnerBox, dashPlanAccent, dashSectionTitle } from "@/lib/dashboard-theme";



const sectionStyle: React.CSSProperties = {

  marginTop: 14,

  padding: 10,

  ...dashInnerBox,

};



const titleStyle: React.CSSProperties = {

  ...dashSectionTitle,

  margin: "0 0 6px",

  fontSize: 11,

  lineHeight: 1.4,

};



const textStyle: React.CSSProperties = {

  color: DASH.muted,

  margin: "0 0 6px",

  fontSize: 9,

  lineHeight: 1.5,

};



const listStyle: React.CSSProperties = {

  margin: "4px 0 0",

  paddingLeft: 14,

  fontSize: 9,

  color: DASH.text,

  lineHeight: 1.55,

};



const planTag: React.CSSProperties = {

  display: "inline-block",

  marginTop: 6,

  fontSize: 8,

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

    <div style={sectionStyle}>

      <p style={titleStyle}>{emoji} {title}</p>

      {description && <p style={textStyle}>{description}</p>}

      {subtitle && <p style={{ ...textStyle, marginBottom: 4 }}>{subtitle}</p>}

      {items.length > 0 && (

        <ul style={listStyle}>

          {items.map((item) => (

            <li key={item}>{item}</li>

          ))}

        </ul>

      )}

      {plano && <span style={planTag}>Plano: {plano}</span>}

    </div>

  );

}



export default function CompanyExclusiveFeatures() {

  return (

    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${DASH.border}` }}>

      <h3 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 13 }}>

        Recursos do Recruta Indústria

      </h3>

      <p style={{ color: DASH.text, margin: "0 0 4px", fontSize: 10, lineHeight: 1.5 }}>

        Ferramentas disponíveis hoje na plataforma para buscar e analisar profissionais da indústria.

      </p>



      <FeatureSection

        emoji="🔍"

        title="Busca e perfil resumido"

        description="Pesquise profissionais e veja dados parciais antes de liberar o contato."

        items={[

          "Estado, cidade, área e cargo",

          "Experiência, formação e habilidades principais",

          "Segmentos e equipamentos (visão resumida)",

        ]}

        plano="Free"

      />



      <FeatureSection

        emoji="🎯"

        title="Índice de compatibilidade"

        description="Ao buscar com filtros, cada perfil recebe uma pontuação de compatibilidade e os resultados são ordenados do mais compatível para o menos compatível."

        subtitle="O cálculo considera os filtros que você aplicou, como:"

        items={[

          "Cargo, área e experiência",

          "Segmento industrial e máquinas",

          "Turno, localização e pretensão salarial",

          "CNH, viagens e disponibilidade para mudança",

        ]}

        plano="Free (com filtros básicos) · Basic+ (filtros avançados)"

      />



      <FeatureSection

        emoji="⚙️"

        title="Filtros industriais avançados"

        description="Refine a busca com critérios específicos do setor industrial."

        subtitle="Filtros disponíveis:"

        items={[

          "Escolaridade, turno, recolocação e tempo de experiência",

          "Segmento industrial, máquinas e qualidade",

          "Informática/ERP, CNH, viagens e mudança",

          "Curso ou certificação",

          "Pretensão salarial",

        ]}

        plano="Basic+"

      />



      <FeatureSection

        emoji="🔓"

        title="Liberação de contatos"

        description="Desbloqueie o perfil completo para ver telefone, e-mail, WhatsApp, currículo e demais informações cadastradas."

        items={[

          "Até 50 liberações por mês no Basic",

          "Liberações ilimitadas no Premium e Empresarial",

        ]}

        plano="Basic+"

      />



      <div style={sectionStyle}>

        <p style={titleStyle}>💡 Dicas anônimas para profissionais</p>

        <p style={textStyle}>

          Envie sugestões anônimas para ajudar o profissional a melhorar o perfil. O profissional visualiza as dicas no painel dele.

        </p>

        <span style={planTag}>Plano: Basic+</span>

      </div>



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

          "Link do currículo e certificados anexos",

        ]}

        plano="Basic+"

      />



      <FeatureSection

        emoji="📊"

        title="Dashboard de recrutamento"

        description="Acompanhe números da sua atividade na plataforma."

        items={[

          "Profissionais visualizados",

          "Perfis favoritados",

          "Pesquisas realizadas",

          "Liberações do mês e alertas ativos",

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



      <div style={sectionStyle}>

        <p style={titleStyle}>🏭 Plataforma para a indústria</p>

        <p style={{ ...textStyle, color: DASH.text, margin: 0 }}>

          Cadastro detalhado do profissional, busca com filtros industriais e liberação controlada de contatos conforme o plano da empresa.

        </p>

      </div>

    </div>

  );

}


