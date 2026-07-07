import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getProfessionalPlanTier } from "@/lib/professional-storage";

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
    Recruta Indústria — notificação do plano Premium por atividade no seu perfil profissional.
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

  const tier = await getProfessionalPlanTier(profile.userId);
  if (tier !== "PREMIUM") return null;

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
       <p>Responda ou gerencie suas mensagens no painel.</p>`,
    ),
    text: `Olá, ${recipient.name}! ${companyName} enviou: "${preview}${suffix}". Acesse: ${dashboardLink()}`,
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
