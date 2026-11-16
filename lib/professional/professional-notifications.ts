import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isAnyCompanyAnonymous } from "@/lib/company/company-preferences";
import { emailHomeUrl } from "@/lib/notifications/email-home-link";
import { resolveLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import {
  renderFavoriteEmail,
  renderInterviewCancelledByProfessionalEmail,
  renderInterviewCancelledEmail,
  renderInterviewConfirmedEmail,
  renderInterviewInviteEmail,
  renderInterviewResponseEmail,
  renderMessageReceivedEmail,
  renderMessageReplyEmail,
  renderProfileViewedEmail,
  renderTipEmail,
  type InterviewMailFacts,
} from "@/lib/professional/activity-email";
import { renderProposalReceivedEmail, renderProposalResponseEmail } from "@/lib/professional/proposal-email";

function homeLink(): string {
  return emailHomeUrl();
}

function displayName(name: string | null | undefined, locale: string | null | undefined, fallback: "mail.fallback.professional" | "mail.fallback.company"): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return t(fallback, resolveLocale(locale));
}

async function getProfessionalRecipient(profileId: string): Promise<{
  email: string;
  name: string;
  locale: string | null;
} | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: { select: { name: true, email: true, locale: true } } },
  });

  if (!profile) return null;

  // Notificações de recrutamento liberadas para todos os profissionais
  // (plano Premium ainda não está ativo no produto).
  const email = (profile.email || profile.user.email)?.toLowerCase().trim();
  if (!email) return null;

  return {
    email,
    name: displayName(profile.user.name, profile.user.locale, "mail.fallback.professional"),
    locale: profile.user.locale,
  };
}

async function getCompanyDisplayName(companyUserId: string, locale?: string | null): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: companyUserId },
    include: { company: { select: { name: true } } },
  });

  return user?.company?.name?.trim() || user?.name?.trim() || displayName(null, locale, "mail.fallback.company");
}

/** Dispara e-mail sem bloquear a resposta da API. */
export function notifyProfessionalAsync(
  fn: () => Promise<void>,
): void {
  void fn().catch((err) => {
    console.error("[notificação profissional]", err);
  });
}

/** Texto do e-mail de perfil visualizado. Modo anônimo não gera mensagem identificada. */
export function conteudoEmailPerfilVisualizado(input: {
  professionalName: string;
  companyName: string;
  anonymous: boolean;
  homeUrl: string;
  locale?: string | null;
}): { subject: string; htmlInner: string; text: string } | null {
  if (input.anonymous) return null;
  const message = renderProfileViewedEmail({
    locale: input.locale,
    recipientName: input.professionalName,
    companyName: input.companyName,
    homeUrl: input.homeUrl,
  });
  return { subject: message.subject, htmlInner: message.html, text: message.text };
}

/** Perfil visualizado com acesso completo (desbloqueado). Máx. 1 e-mail por empresa a cada 24h. */
export async function notifyProfileViewed(
  profileId: string,
  companyUserId: string,
  actorUserId?: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  if (await isAnyCompanyAnonymous([companyUserId, actorUserId])) return;

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

  const companyName = await getCompanyDisplayName(companyUserId, recipient.locale);
  const conteudo = conteudoEmailPerfilVisualizado({
    professionalName: recipient.name,
    companyName,
    anonymous: false,
    homeUrl: homeLink(),
    locale: recipient.locale,
  });
  if (!conteudo) return;

  await sendEmail({
    to: recipient.email,
    subject: conteudo.subject,
    html: conteudo.htmlInner,
    text: conteudo.text,
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
  const message = renderTipEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    preview: `${preview}${suffix}`,
    homeUrl: homeLink(),
  });

  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
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
  const message = renderMessageReceivedEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName,
    preview: `${preview}${suffix}`,
    homeUrl: homeLink(),
  });

  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
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
    select: { email: true, name: true, locale: true },
  });
  if (!user?.email) return;

  const preview = params.messageBody.trim().slice(0, 300);
  const suffix = params.messageBody.length > 300 ? "…" : "";
  const message = renderMessageReplyEmail({
    locale: user.locale,
    recipientName: user.name?.trim() || "",
    professionalName: params.professionalName,
    preview: `${preview}${suffix}`,
    homeUrl: homeLink(),
  });

  await sendEmail({
    to: user.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function notifyProfileFavorited(
  profileId: string,
  companyUserId: string,
): Promise<void> {
  const recipient = await getProfessionalRecipient(profileId);
  if (!recipient) return;

  const companyName = await getCompanyDisplayName(companyUserId, recipient.locale);
  const message = renderFavoriteEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName,
    homeUrl: homeLink(),
  });

  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
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

  const message = renderProposalReceivedEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName: params.companyName,
    cargo: params.cargo,
    salario: params.salario,
    turno: params.turno,
    cidade: params.cidade,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
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
    select: { email: true, name: true, locale: true },
  });
  if (!user?.email) return;

  const message = renderProposalResponseEmail({
    locale: user.locale,
    recipientName: user.name?.trim() || "",
    professionalName: params.professionalName,
    action: params.action,
    cargo: params.cargo,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: user.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function notifyInterviewInvite(params: {
  profileId: string;
  companyName: string;
  interview: InterviewMailFacts;
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  const message = renderInterviewInviteEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName: params.companyName,
    interview: params.interview,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

/** Confirmação de retorno ao profissional com o comprovante no idioma da conta. */
export async function notifyInterviewConfirmedToProfessional(params: {
  profileId: string;
  companyName: string;
  interview: InterviewMailFacts;
}): Promise<void> {
  const recipient = await getProfessionalRecipient(params.profileId);
  if (!recipient) return;

  const message = renderInterviewConfirmedEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName: params.companyName,
    interview: params.interview,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
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

  const message = renderInterviewCancelledEmail({
    locale: recipient.locale,
    recipientName: recipient.name,
    companyName: params.companyName,
    justification: params.justification,
    by: params.by,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: recipient.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function notifyCompanyInterviewResponse(params: {
  companyUserId: string;
  professionalName: string;
  confirmed: boolean;
  companyName: string;
  interview: InterviewMailFacts;
  profileId?: string;
  proposalId?: string;
}): Promise<void> {
  const { resolveCompanyOwnerUserId } = await import("@/lib/company/company-team");
  const ownerId =
    (await resolveCompanyOwnerUserId(params.companyUserId)) || params.companyUserId;
  const recipientIds = [...new Set([params.companyUserId, ownerId].filter(Boolean))];
  const href = "/company/dashboard-empresa?tab=entrevistas";
  const companyDash = homeLink();

  for (const userId of recipientIds) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, locale: true },
    });
    const message = renderInterviewResponseEmail({
      locale: user?.locale,
      professionalName: params.professionalName,
      confirmed: params.confirmed,
      interview: params.interview,
      companyName: params.companyName,
      homeUrl: companyDash,
    });

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: params.confirmed
            ? "interview_confirmed_by_professional"
            : "interview_declined_by_professional",
          title: message.title,
          body: message.inAppBody,
          href,
          metadata: JSON.stringify({
            profileId: params.profileId || null,
            proposalId: params.proposalId || null,
            confirmed: params.confirmed,
          }),
        },
      });
    } catch (err) {
      console.warn("[notifyCompanyInterviewResponse] in-app", err);
    }

    if (!user?.email) continue;

    await sendEmail({
      to: user.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

export async function notifyCompanyInterviewCancelledByProfessional(params: {
  companyUserId: string;
  professionalName: string;
  justification: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.companyUserId },
    select: { email: true, name: true, locale: true },
  });
  if (!user?.email) return;

  const message = renderInterviewCancelledByProfessionalEmail({
    locale: user.locale,
    professionalName: params.professionalName,
    justification: params.justification,
    homeUrl: homeLink(),
  });
  await sendEmail({
    to: user.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
