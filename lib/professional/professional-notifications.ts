import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const DASHBOARD_URL = "/professional/dashboard";

function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function dashboardLink(): string {
  return `${appBaseUrl()}${DASHBOARD_URL}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">${escapeHtml(title)}</h2>
  ${bodyHtml}
  <p style="margin-top: 24px;">
    <a href="${dashboardLink()}" style="display: inline-block; background: #b8860b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
      Acessar meu painel
    </a>
  </p>
  <p style="font-size: 12px; color: #666; margin-top: 32px;">
    Recruta Indústria — notificação por atividade no seu perfil profissional.
  </p>
</body>
</html>`;
}

async function getProfessionalRecipient(profileId: string): Promise<{
  email: string;
  name: string;
} | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!profile) return null;

  // Notificações de recrutamento liberadas para todos os profissionais
  // (plano Premium ainda não está ativo no produto).
  const email = (profile.email || profile.user.email)?.toLowerCase().trim();
  if (!email) return null;

  return {
    email,
    name: profile.user.name?.trim() || "Profissional",
  };
}

async function getCompanyDisplayName(companyUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: companyUserId },
    include: { company: { select: { name: true } } },
  });

  return user?.company?.name || user?.name || "Uma empresa";
}

/** Dispara e-mail sem bloquear a resposta da API. */
export function notifyProfessionalAsync(
  fn: () => Promise<void>,
): void {
  void fn().catch((err) => {
    console.error("[notificação profissional]", err);
  });
}

/** Perfil visualizado com acesso completo (desbloqueado). Máx. 1 e-mail por empresa a cada 24h. */
export async function notifyProfileViewed(
  profileId: string,
  companyUserId: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentViews = await prisma.profileView.count({
    where: {
      profileId,
      companyUserId,
      viewType: "FULL",
      createdAt: { gte: since },
    },
  });

  if (recentViews > 1) return;

  const companyName = await getCompanyDisplayName(companyUserId);

  await sendEmail({
    to: recipient.email,
    subject: "Sua empresa interessada visualizou seu perfil — Recruta Indústria",
    html: emailLayout(
      "Seu perfil foi visualizado",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>A empresa <strong>${escapeHtml(companyName)}</strong> visualizou seu perfil completo na plataforma.</p>
       <p>Acesse seu painel para ver mensagens, dicas e outras interações.</p>`,
    ),
    text: `Olá, ${recipient.name}! A empresa ${companyName} visualizou seu perfil completo. Acesse: ${dashboardLink()}`,
  });
}

export async function notifyTipReceived(
  profileId: string,
  tipMessage: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  const preview = tipMessage.trim().slice(0, 200);
  const suffix = tipMessage.length > 200 ? "…" : "";

  await sendEmail({
    to: recipient.email,
    subject: "Você recebeu uma nova dica — Recruta Indústria",
    html: emailLayout(
      "Nova dica no seu perfil",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>Uma empresa deixou uma dica anônima no seu perfil:</p>
       <blockquote style="border-left: 4px solid #b8860b; margin: 16px 0; padding: 8px 16px; background: #fafafa;">
         ${escapeHtml(preview)}${suffix}
       </blockquote>
       <p>Veja todas as dicas no seu painel profissional.</p>`,
    ),
    text: `Olá, ${recipient.name}! Você recebeu uma dica: "${preview}${suffix}". Acesse: ${dashboardLink()}`,
  });
}

export async function notifyMessageReceived(
  profileId: string,
  companyName: string,
  messageBody: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  const preview = messageBody.trim().slice(0, 300);
  const suffix = messageBody.length > 300 ? "…" : "";

  await sendEmail({
    to: recipient.email,
    subject: `Nova mensagem de ${companyName} — Recruta Indústria`,
    html: emailLayout(
      "Nova mensagem no seu perfil",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p><strong>${escapeHtml(companyName)}</strong> enviou uma mensagem:</p>
       <blockquote style="border-left: 4px solid #b8860b; margin: 16px 0; padding: 8px 16px; background: #fafafa;">
         ${escapeHtml(preview)}${suffix}
       </blockquote>
       <p>Você pode responder pela caixa de mensagens do seu painel.</p>`,
    ),
    text: `Olá, ${recipient.name}! ${companyName} enviou: "${preview}${suffix}". Responda no painel: ${dashboardLink()}`,
  });
}

/** Notifica a empresa quando o profissional responde. */
export async function notifyCompanyMessageReply(params: {
  companyUserId: string;
  professionalName: string;
  messageBody: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.companyUserId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  const preview = params.messageBody.trim().slice(0, 300);
  const suffix = params.messageBody.length > 300 ? "…" : "";
  const companyDash = `${appBaseUrl()}/company/dashboard-empresa`;

  await sendEmail({
    to: user.email,
    subject: `Resposta de ${params.professionalName} — Recruta Indústria`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">Resposta do profissional</h2>
  <p>Olá${user.name ? `, <strong>${escapeHtml(user.name)}</strong>` : ""}!</p>
  <p><strong>${escapeHtml(params.professionalName)}</strong> respondeu sua mensagem:</p>
  <blockquote style="border-left: 4px solid #b8860b; margin: 16px 0; padding: 8px 16px; background: #fafafa;">
    ${escapeHtml(preview)}${suffix}
  </blockquote>
  <p><a href="${companyDash}" style="display:inline-block;background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Abrir painel da empresa</a></p>
</body>
</html>`,
    text: `${params.professionalName} respondeu: "${preview}${suffix}". Acesse: ${companyDash}`,
  });
}

export async function notifyProfileFavorited(
  profileId: string,
  companyUserId: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  const companyName = await getCompanyDisplayName(companyUserId);

  await sendEmail({
    to: recipient.email,
    subject: "Seu perfil foi favoritado — Recruta Indústria",
    html: emailLayout(
      "Seu perfil foi favoritado",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>A empresa <strong>${escapeHtml(companyName)}</strong> adicionou seu perfil aos favoritos.</p>
       <p>Isso indica interesse da empresa em você. Acompanhe no seu painel.</p>`,
    ),
    text: `Olá, ${recipient.name}! A empresa ${companyName} favoritou seu perfil. Acesse: ${dashboardLink()}`,
  });
}

export async function notifyProposalReceived(params: {
  profileId: string;
  companyName: string;
  cargo: string;
  salario: string;
  turno: string;
  cidade: string;
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  await sendEmail({
    to: recipient.email,
    subject: `Nova proposta: ${params.cargo} — Recruta Indústria`,
    html: emailLayout(
      "Nova proposta recebida",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>A empresa <strong>${escapeHtml(params.companyName)}</strong> enviou uma proposta:</p>
       <ul>
         <li><strong>Cargo:</strong> ${escapeHtml(params.cargo)}</li>
         <li><strong>Salário:</strong> ${escapeHtml(params.salario.startsWith("R$") ? params.salario : `R$ ${params.salario}`)}</li>
         <li><strong>Turno:</strong> ${escapeHtml(params.turno)}</li>
         <li><strong>Cidade:</strong> ${escapeHtml(params.cidade)}</li>
       </ul>
       <p>Acesse o painel para responder: Tenho interesse, Quero mais informações ou Não tenho interesse.</p>`,
    ),
    text: `Nova proposta de ${params.companyName}: ${params.cargo}, ${params.salario}, ${params.turno}, ${params.cidade}. Acesse: ${dashboardLink()}`,
  });
}

export async function notifyCompanyProposalResponse(params: {
  companyUserId: string;
  professionalName: string;
  action: "INTERESTED" | "MORE_INFO" | "DECLINED";
  cargo: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.companyUserId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  const companyDash = `${appBaseUrl()}/company/dashboard-empresa`;
  const titles = {
    INTERESTED: "O profissional demonstrou interesse na oportunidade",
    MORE_INFO: "O profissional pediu mais informações",
    DECLINED: "O profissional não tem interesse na oportunidade",
  } as const;

  await sendEmail({
    to: user.email,
    subject: `${titles[params.action]} — Recruta Indústria`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">${escapeHtml(titles[params.action])}</h2>
  <p>Olá${user.name ? `, <strong>${escapeHtml(user.name)}</strong>` : ""}!</p>
  <p><strong>${escapeHtml(params.professionalName)}</strong> respondeu à proposta de <strong>${escapeHtml(params.cargo)}</strong>.</p>
  ${params.action === "INTERESTED" ? "<p>Você já pode agendar a entrevista no perfil do candidato.</p>" : ""}
  ${params.action === "MORE_INFO" ? "<p>Continue a conversa pela caixa de mensagens do perfil.</p>" : ""}
  <p><a href="${companyDash}" style="display:inline-block;background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Abrir painel da empresa</a></p>
</body>
</html>`,
    text: `${titles[params.action]}. ${params.professionalName} — ${params.cargo}. Acesse: ${companyDash}`,
  });
}

export async function notifyInterviewInvite(params: {
  profileId: string;
  companyName: string;
  comprovanteHtml: string;
  comprovanteText: string;
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  await sendEmail({
    to: recipient.email,
    subject: `Convite de entrevista — ${params.companyName}`,
    html: emailLayout(
      "Convite de entrevista",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>A empresa <strong>${escapeHtml(params.companyName)}</strong> agendou uma entrevista. Confira o comprovante:</p>
       ${params.comprovanteHtml}
       <p>Acesse o painel para <strong>confirmar</strong> ou <strong>recusar</strong> o convite.</p>`,
    ),
    text: `Convite de entrevista de ${params.companyName}.\n\n${params.comprovanteText}\n\nConfirme no painel: ${dashboardLink()}`,
  });
}

/** Confirmação de retorno ao profissional com o mesmo comprovante. */
export async function notifyInterviewConfirmedToProfessional(params: {
  profileId: string;
  companyName: string;
  comprovanteHtml: string;
  comprovanteText: string;
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  await sendEmail({
    to: recipient.email,
    subject: `Entrevista confirmada — comprovante — ${params.companyName}`,
    html: emailLayout(
      "Entrevista confirmada",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>Sua confirmação foi registrada. Guarde este comprovante de agendamento:</p>
       ${params.comprovanteHtml}
       <p>Compareça no horário combinado. Em caso de imprevisto, fale com a empresa pelo painel.</p>`,
    ),
    text: `Entrevista confirmada com ${params.companyName}.\n\n${params.comprovanteText}\n\nPainel: ${dashboardLink()}`,
  });
}

export async function notifyInterviewCancelled(params: {
  profileId: string;
  companyName: string;
  justification: string;
  by: "company" | "professional";
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  const who =
    params.by === "company"
      ? `A empresa <strong>${escapeHtml(params.companyName)}</strong> cancelou a entrevista.`
      : `O cancelamento da entrevista com <strong>${escapeHtml(params.companyName)}</strong> foi registrado.`;

  await sendEmail({
    to: recipient.email,
    subject: `Entrevista cancelada — ${params.companyName}`,
    html: emailLayout(
      "Entrevista cancelada",
      `<p>Olá, <strong>${escapeHtml(recipient.name)}</strong>!</p>
       <p>${who}</p>
       <p><strong>Justificativa:</strong> ${escapeHtml(params.justification)}</p>
       <p>Acompanhe o painel para novos convites ou reagendamentos.</p>`,
    ),
    text: `Entrevista cancelada (${params.companyName}). Justificativa: ${params.justification}. Painel: ${dashboardLink()}`,
  });
}

export async function notifyCompanyInterviewResponse(params: {
  companyUserId: string;
  professionalName: string;
  confirmed: boolean;
  comprovanteText: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.companyUserId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  const companyDash = `${appBaseUrl()}/company/dashboard-empresa`;
  const title = params.confirmed
    ? "Profissional confirmou a entrevista"
    : "Profissional recusou a entrevista";

  await sendEmail({
    to: user.email,
    subject: `${title} — Recruta Indústria`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">${escapeHtml(title)}</h2>
  <p><strong>${escapeHtml(params.professionalName)}</strong> ${params.confirmed ? "confirmou" : "recusou"} a entrevista.</p>
  <pre style="white-space:pre-wrap;background:#fafafa;padding:12px;border-radius:6px;">${escapeHtml(params.comprovanteText)}</pre>
  <p><a href="${companyDash}" style="display:inline-block;background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Abrir painel da empresa</a></p>
</body>
</html>`,
    text: `${title}. ${params.professionalName}.\n\n${params.comprovanteText}\n\n${companyDash}`,
  });
}

export async function notifyCompanyInterviewCancelledByProfessional(params: {
  companyUserId: string;
  professionalName: string;
  justification: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.companyUserId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  const companyDash = `${appBaseUrl()}/company/dashboard-empresa`;
  await sendEmail({
    to: user.email,
    subject: `Profissional cancelou a entrevista — Recruta Indústria`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">Entrevista cancelada pelo profissional</h2>
  <p><strong>${escapeHtml(params.professionalName)}</strong> cancelou a entrevista.</p>
  <p><strong>Justificativa:</strong> ${escapeHtml(params.justification)}</p>
  <p><a href="${companyDash}" style="display:inline-block;background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Abrir painel da empresa</a></p>
</body>
</html>`,
    text: `Entrevista cancelada por ${params.professionalName}. Justificativa: ${params.justification}. ${companyDash}`,
  });
}
