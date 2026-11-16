import { htmlLang, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

export type ProposalResponseAction = "INTERESTED" | "MORE_INFO" | "DECLINED";

function escapeHtml(text: string): string {
  return text
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

/** Proposta continua em BRL. Valor já formatado não recebe outro símbolo. */
export function proposalSalaryLabel(salary: string): string {
  const value = salary.trim();
  if (!value) return value;
  if (value.startsWith("R$")) return value;
  return `R$ ${value}`;
}

export function renderMailDocument(locale: SupportedLocale, title: string, innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="${htmlLang(locale)}">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">${escapeHtml(title)}</h2>
  ${innerHtml}
</body>
</html>`;
}

function layout(locale: SupportedLocale, title: string, bodyHtml: string, homeUrl: string): string {
  const inner = `${bodyHtml}
  <p style="margin-top: 24px;">
    <a href="${escapeHtml(homeUrl)}" style="display: inline-block; background: #b8860b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${escapeHtml(text("mail.layout.openDashboard", locale))}</a>
  </p>
  <p style="font-size: 12px; color: #666; margin-top: 32px;">${escapeHtml(text("mail.layout.footer", locale))}</p>`;
  return renderMailDocument(locale, title, inner);
}

export function renderProposalReceivedEmail(input: {
  locale?: string | null;
  recipientName: string;
  companyName: string;
  cargo: string;
  salario: string;
  turno: string;
  cidade: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const salary = proposalSalaryLabel(input.salario);
  const subject = text("mail.proposal.subject", locale, { role: input.cargo });
  const body = `<p>${escapeHtml(text("mail.proposal.hello", locale, { name: input.recipientName }))}</p>
       <p>${escapeHtml(text("mail.proposal.intro", locale, { company: input.companyName }))}</p>
       <ul>
         <li><strong>${escapeHtml(text("mail.proposal.role", locale))}:</strong> ${escapeHtml(input.cargo)}</li>
         <li><strong>${escapeHtml(text("mail.proposal.salary", locale))}:</strong> ${escapeHtml(salary)}</li>
         <li><strong>${escapeHtml(text("mail.proposal.shift", locale))}:</strong> ${escapeHtml(input.turno)}</li>
         <li><strong>${escapeHtml(text("mail.proposal.city", locale))}:</strong> ${escapeHtml(input.cidade)}</li>
       </ul>
       <p>${escapeHtml(text("mail.proposal.replyHint", locale))}</p>`;
  return {
    subject,
    html: layout(locale, text("mail.proposal.title", locale), body, input.homeUrl),
    text: text("mail.proposal.text", locale, {
      company: input.companyName,
      role: input.cargo,
      salary,
      shift: input.turno,
      city: input.cidade,
      url: input.homeUrl,
    }),
  };
}

const RESPONSE_TITLE: Record<ProposalResponseAction, MessageKey> = {
  INTERESTED: "mail.proposalResponse.interested",
  MORE_INFO: "mail.proposalResponse.moreInfo",
  DECLINED: "mail.proposalResponse.declined",
};

export function renderProposalResponseEmail(input: {
  locale?: string | null;
  recipientName: string;
  professionalName: string;
  action: ProposalResponseAction;
  cargo: string;
  homeUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = resolveLocale(input.locale);
  const title = text(RESPONSE_TITLE[input.action], locale);
  const hello = input.recipientName.trim()
    ? text("mail.proposalResponse.hello", locale, { name: input.recipientName })
    : text("mail.proposalResponse.helloPlain", locale);
  const extra = input.action === "INTERESTED"
    ? `<p>${escapeHtml(text("mail.proposalResponse.schedule", locale))}</p>`
    : input.action === "MORE_INFO"
      ? `<p>${escapeHtml(text("mail.proposalResponse.continueChat", locale))}</p>`
      : "";
  const body = `<p>${escapeHtml(hello)}</p>
  <p>${escapeHtml(text("mail.proposalResponse.body", locale, { name: input.professionalName, role: input.cargo }))}</p>
  ${extra}
  <p><a href="${escapeHtml(input.homeUrl)}" style="display:inline-block;background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">${escapeHtml(text("mail.proposalResponse.openPanel", locale))}</a></p>`;
  return {
    subject: `${title} — Recruta Indústria`,
    html: `<!DOCTYPE html>
<html lang="${htmlLang(locale)}">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b8860b; margin-top: 0;">${escapeHtml(title)}</h2>
  ${body}
</body>
</html>`,
    text: text("mail.proposalResponse.text", locale, {
      title,
      name: input.professionalName,
      role: input.cargo,
      url: input.homeUrl,
    }),
  };
}
