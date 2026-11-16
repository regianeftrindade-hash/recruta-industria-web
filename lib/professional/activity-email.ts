import {
  formatInterviewComprovante,
  type InterviewLocationType,
} from "@/lib/company/job-proposals-shared";
import { resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { renderMailDocument } from "@/lib/professional/proposal-email";

export type InterviewMailFacts = {
  scheduledAt: Date | string;
  locationType: InterviewLocationType;
  address?: string | null;
  meetingUrl?: string | null;
  observacoes?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_match, key: string) => vars[key] ?? "");
}

function text(key: MessageKey, locale: SupportedLocale, vars: Record<string, string> = {}): string {
  return fill(t(key, locale), vars);
}

function button(homeUrl: string, label: string): string {
  return `<p style="margin-top: 24px;"><a href="${escapeHtml(homeUrl)}" style="display: inline-block; background: #b8860b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${escapeHtml(label)}</a></p>`;
}

function professionalShell(locale: SupportedLocale, title: string, bodyHtml: string, homeUrl: string): string {
  return renderMailDocument(
    locale,
    title,
    `${bodyHtml}
  ${button(homeUrl, text("mail.layout.openDashboard", locale))}
  <p style="font-size: 12px; color: #666; margin-top: 32px;">${escapeHtml(text("mail.layout.footer", locale))}</p>`,
  );
}

function quote(value: string): string {
  return `<blockquote style="border-left: 4px solid #b8860b; margin: 16px 0; padding: 8px 16px; background: #fafafa;">${escapeHtml(value)}</blockquote>`;
}

export function renderProfileViewedEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const company = input.companyName.trim() || text("mail.fallback.company", locale);
  const body = `<p>${escapeHtml(text("mail.profileViewed.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.profileViewed.body", locale, { company }))}</p>
       <p>${escapeHtml(text("mail.profileViewed.hint", locale))}</p>`;
  return {
    subject: text("mail.profileViewed.subject", locale),
    html: professionalShell(locale, text("mail.profileViewed.title", locale), body, input.homeUrl),
    text: text("mail.profileViewed.text", locale, { name: input.recipientName, company, url: input.homeUrl }),
  };
}

export function renderTipEmail(input: {
  locale?: string | null;
  recipientName: string;
  preview: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const body = `<p>${escapeHtml(text("mail.tip.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.tip.intro", locale))}</p>
       ${quote(input.preview)}
       <p>${escapeHtml(text("mail.tip.hint", locale))}</p>`;
  return {
    subject: text("mail.tip.subject", locale),
    html: professionalShell(locale, text("mail.tip.title", locale), body, input.homeUrl),
    text: text("mail.tip.text", locale, { name: input.recipientName, preview: input.preview, url: input.homeUrl }),
  };
}

export function renderMessageReceivedEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  preview: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const body = `<p>${escapeHtml(text("mail.message.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.message.intro", locale, { company: input.companyName }))}</p>
       ${quote(input.preview)}
       <p>${escapeHtml(text("mail.message.hint", locale))}</p>`;
  return {
    subject: text("mail.message.subject", locale, { company: input.companyName }),
    html: professionalShell(locale, text("mail.message.title", locale), body, input.homeUrl),
    text: text("mail.message.text", locale, {
      name: input.recipientName,
      company: input.companyName,
      preview: input.preview,
      url: input.homeUrl,
    }),
  };
}

export function renderMessageReplyEmail(input: {
  locale?: string | null;
  recipientName: string;
  professionalName: string;
  preview: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const hello = input.recipientName.trim()
    ? text("mail.messageReply.hello", locale, { name: input.recipientName })
    : text("mail.messageReply.helloPlain", locale);
  const body = `<p>${escapeHtml(hello)}</p>
       <p>${escapeHtml(text("mail.messageReply.body", locale, { name: input.professionalName }))}</p>
       ${quote(input.preview)}
       ${button(input.homeUrl, text("mail.proposalResponse.openPanel", locale))}`;
  return {
    subject: text("mail.messageReply.subject", locale, { name: input.professionalName }),
    html: renderMailDocument(locale, text("mail.messageReply.title", locale), body),
    text: text("mail.messageReply.text", locale, {
      name: input.professionalName,
      preview: input.preview,
      url: input.homeUrl,
    }),
  };
}

export function renderFavoriteEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const body = `<p>${escapeHtml(text("mail.favorite.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.favorite.body", locale, { company: input.companyName }))}</p>
       <p>${escapeHtml(text("mail.favorite.hint", locale))}</p>`;
  return {
    subject: text("mail.favorite.subject", locale),
    html: professionalShell(locale, text("mail.favorite.title", locale), body, input.homeUrl),
    text: text("mail.favorite.text", locale, {
      name: input.recipientName,
      company: input.companyName,
      url: input.homeUrl,
    }),
  };
}

function proofFor(locale: SupportedLocale, companyName: string, facts: InterviewMailFacts) {
  return formatInterviewComprovante({
    companyName,
    scheduledAt: facts.scheduledAt,
    locationType: facts.locationType,
    address: facts.address,
    meetingUrl: facts.meetingUrl,
    observacoes: facts.observacoes || "",
    locale,
  });
}

export function renderInterviewInviteEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  interview: InterviewMailFacts;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const proof = proofFor(locale, input.companyName, input.interview);
  const body = `<p>${escapeHtml(text("mail.interviewInvite.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.interviewInvite.body", locale, { company: input.companyName }))}</p>
       ${proof.html}
       <p>${escapeHtml(text("mail.interviewInvite.hint", locale))}</p>`;
  return {
    subject: text("mail.interviewInvite.subject", locale, { company: input.companyName }),
    html: professionalShell(locale, text("mail.interviewInvite.title", locale), body, input.homeUrl),
    text: text("mail.interviewInvite.text", locale, {
      company: input.companyName,
      proof: proof.text,
      url: input.homeUrl,
    }),
  };
}

export function renderInterviewConfirmedEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  interview: InterviewMailFacts;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const proof = proofFor(locale, input.companyName, input.interview);
  const body = `<p>${escapeHtml(text("mail.interviewConfirmed.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.interviewConfirmed.body", locale))}</p>
       ${proof.html}
       <p>${escapeHtml(text("mail.interviewConfirmed.hint", locale))}</p>`;
  return {
    subject: text("mail.interviewConfirmed.subject", locale, { company: input.companyName }),
    html: professionalShell(locale, text("mail.interviewConfirmed.title", locale), body, input.homeUrl),
    text: text("mail.interviewConfirmed.text", locale, {
      company: input.companyName,
      proof: proof.text,
      url: input.homeUrl,
    }),
  };
}

export function renderInterviewCancelledEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  justification: string;
  by: "company" | "professional";
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const who = input.by === "company"
    ? text("mail.interviewCancelled.byCompany", locale, { company: input.companyName })
    : text("mail.interviewCancelled.byProfessional", locale, { company: input.companyName });
  const body = `<p>${escapeHtml(text("mail.interviewCancelled.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(who)}</p>
       <p><strong>${escapeHtml(text("mail.interviewCancelled.reasonLabel", locale))}:</strong> ${escapeHtml(input.justification)}</p>
       <p>${escapeHtml(text("mail.interviewCancelled.hint", locale))}</p>`;
  return {
    subject: text("mail.interviewCancelled.subject", locale, { company: input.companyName }),
    html: professionalShell(locale, text("mail.interviewCancelled.title", locale), body, input.homeUrl),
    text: text("mail.interviewCancelled.text", locale, {
      company: input.companyName,
      reason: input.justification,
      url: input.homeUrl,
    }),
  };
}

export function renderInterviewResponseEmail(input: {
  locale?: string | null;
  professionalName: string;
  confirmed: boolean;
  interview: InterviewMailFacts;
  companyName: string;
  homeUrl: string;
}): { subject: string; html: string; text: string; title: string; inAppBody: string } {
  const locale = resolveLocale(input.locale);
  const professional = input.professionalName.trim() || text("mail.fallback.professional", locale);
  const proof = proofFor(locale, input.companyName, input.interview);
  const title = text(
    input.confirmed ? "mail.interviewResponse.confirmedTitle" : "mail.interviewResponse.declinedTitle",
    locale,
  );
  const line = text(
    input.confirmed ? "mail.interviewResponse.confirmedBody" : "mail.interviewResponse.declinedBody",
    locale,
    { name: professional },
  );
  const inAppBody = text(
    input.confirmed ? "mail.interviewResponse.confirmedInApp" : "mail.interviewResponse.declinedInApp",
    locale,
    { name: professional },
  );
  const body = `<p>${escapeHtml(line)}</p>
  <pre style="white-space:pre-wrap;background:#fafafa;padding:12px;border-radius:6px;">${escapeHtml(proof.text)}</pre>
  ${button(input.homeUrl, text("mail.interviewResponse.openInterviews", locale))}`;
  return {
    subject: `${title} — Recruta Indústria`,
    title,
    inAppBody,
    html: renderMailDocument(locale, title, body),
    text: text("mail.interviewResponse.text", locale, {
      title,
      name: professional,
      proof: proof.text,
      url: input.homeUrl,
    }),
  };
}

export function renderInterviewCancelledByProfessionalEmail(input: {
  locale?: string | null;
  professionalName: string;
  justification: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const professional = input.professionalName.trim() || text("mail.fallback.professional", locale);
  const body = `<p>${escapeHtml(text("mail.interviewCancelledByPro.body", locale, { name: professional }))}</p>
       <p><strong>${escapeHtml(text("mail.interviewCancelled.reasonLabel", locale))}:</strong> ${escapeHtml(input.justification)}</p>
       ${button(input.homeUrl, text("mail.proposalResponse.openPanel", locale))}`;
  return {
    subject: text("mail.interviewCancelledByPro.subject", locale),
    html: renderMailDocument(locale, text("mail.interviewCancelledByPro.title", locale), body),
    text: text("mail.interviewCancelledByPro.text", locale, {
      name: professional,
      reason: input.justification,
      url: input.homeUrl,
    }),
  };
}
