import { formatInTimeZone } from "@/lib/datetime/format-in-zone";
import { htmlLang, resolveLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

export type ProfileExportDocument = {
  nome: string;
  cargo: string | null;
  area: string | null;
  cidade: string | null;
  estado: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  disponibilidade: string | null;
  escolaridade: string | null;
  cursos: string[];
  certificacoes: string[];
  idiomas: string[];
  tempoExperiencia: string | null;
  segmentos: string[];
  maquinas: string[];
  qualidade: string[];
  informatica: string[];
  empresas: Array<{ cargo: string; nome: string }>;
  turno: string | null;
  pretensao: string | null;
  cnh: string | null;
  categoriaCnh: string | null;
  viagens: string | null;
  mudanca: string | null;
  apresentacao: string | null;
};

function esc(value: unknown): string {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function label(key: MessageKey, locale: string): string {
  return t(key, locale);
}

function list(items: string[]): string {
  if (!items.length) return "<li>—</li>";
  return items.map((item) => `<li>${esc(item)}</li>`).join("");
}

/** HTML imprimível do perfil. Os dados do candidato permanecem como foram gravados. */
export function renderProfileExportHtml(
  profile: ProfileExportDocument,
  localeInput: string | null | undefined,
  exportedAt = new Date(),
): string {
  const locale = resolveLocale(localeInput);
  const nome = profile.nome.trim() || label("export.profile.fallbackName", locale);
  const when = formatInTimeZone(exportedAt, locale, "America/Sao_Paulo");
  const local = [profile.cidade, profile.estado].filter(Boolean).join(", ");
  const cnh = [profile.cnh, profile.categoriaCnh ? `(${profile.categoriaCnh})` : ""].filter(Boolean).join(" ");

  return `<!DOCTYPE html>
<html lang="${htmlLang(locale)}">
<head>
  <meta charset="utf-8" />
  <title>${esc(nome)}</title>
  <style>
    body { font-family: Oswald, "Bebas Neue", Impact, sans-serif; letter-spacing: 1px; color: #111; max-width: 800px; margin: 24px auto; line-height: 1.5; }
    h1 { color: #8D6B1F; border-bottom: 2px solid #C89B3C; padding-bottom: 8px; }
    h2 { color: #8D6B1F; font-size: 16px; margin-top: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
    .val { margin-bottom: 8px; }
    ul { margin: 4px 0 0 18px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${esc(nome)}</h1>
  <p><strong>${esc(label("export.profile.desiredRole", locale))}:</strong> ${esc(profile.cargo)}</p>
  <p><strong>${esc(label("export.profile.area", locale))}:</strong> ${esc(profile.area)}</p>
  <p><strong>${esc(label("export.profile.location", locale))}:</strong> ${esc(local)}</p>

  <h2>${esc(label("export.profile.contact", locale))}</h2>
  <div class="grid">
    <div><div class="label">${esc(label("export.profile.email", locale))}</div><div class="val">${esc(profile.email)}</div></div>
    <div><div class="label">${esc(label("export.profile.phone", locale))}</div><div class="val">${esc(profile.phone)}</div></div>
    <div><div class="label">${esc(label("export.profile.whatsapp", locale))}</div><div class="val">${esc(profile.whatsapp)}</div></div>
    <div><div class="label">${esc(label("export.profile.availability", locale))}</div><div class="val">${esc(profile.disponibilidade)}</div></div>
  </div>

  <h2>${esc(label("export.profile.education", locale))}</h2>
  <p><strong>${esc(label("export.profile.schooling", locale))}:</strong> ${esc(profile.escolaridade)}</p>
  <p><strong>${esc(label("export.profile.courses", locale))}:</strong></p><ul>${list(profile.cursos)}</ul>
  <p><strong>${esc(label("export.profile.certs", locale))}:</strong></p><ul>${list(profile.certificacoes)}</ul>
  <p><strong>${esc(label("export.profile.languages", locale))}:</strong></p><ul>${list(profile.idiomas)}</ul>

  <h2>${esc(label("export.profile.experience", locale))}</h2>
  <p><strong>${esc(label("export.profile.experienceTime", locale))}:</strong> ${esc(profile.tempoExperiencia)}</p>
  <p><strong>${esc(label("export.profile.segments", locale))}:</strong> ${esc(profile.segmentos.join(", "))}</p>
  <p><strong>${esc(label("export.profile.machines", locale))}:</strong> ${esc(profile.maquinas.join(", "))}</p>
  <p><strong>${esc(label("export.profile.quality", locale))}:</strong> ${esc(profile.qualidade.join(", "))}</p>
  <p><strong>${esc(label("export.profile.software", locale))}:</strong> ${esc(profile.informatica.join(", "))}</p>
  <p><strong>${esc(label("export.profile.history", locale))}:</strong></p>
  <ul>${profile.empresas.length ? profile.empresas.map((item) => `<li>${esc(item.cargo)} — ${esc(item.nome)}</li>`).join("") : "<li>—</li>"}</ul>

  <h2>${esc(label("export.profile.conditions", locale))}</h2>
  <div class="grid">
    <div><div class="label">${esc(label("export.profile.shift", locale))}</div><div class="val">${esc(profile.turno)}</div></div>
    <div><div class="label">${esc(label("export.profile.salaryWish", locale))}</div><div class="val">${esc(profile.pretensao)}</div></div>
    <div><div class="label">${esc(label("export.profile.license", locale))}</div><div class="val">${esc(cnh)}</div></div>
    <div><div class="label">${esc(label("export.profile.travel", locale))}</div><div class="val">${esc(profile.viagens)}</div></div>
    <div><div class="label">${esc(label("export.profile.relocation", locale))}</div><div class="val">${esc(profile.mudanca)}</div></div>
  </div>

  <h2>${esc(label("export.profile.presentation", locale))}</h2>
  <p>${esc(profile.apresentacao)}</p>

  <p style="margin-top:32px;font-size:11px;color:#888;">${esc(label("export.profile.exportedAt", locale).replace("{when}", when))}</p>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
}
