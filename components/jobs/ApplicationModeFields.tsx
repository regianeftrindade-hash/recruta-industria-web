"use client";

import { APPLICATION_MODES, type ApplicationMode } from "@/lib/jobs/job-posting";
import styles from "@/app/admin/vagas/vagas-admin.module.css";

export default function ApplicationModeFields({
  mode,
  url,
  email,
  whatsapp,
  onMode,
  onUrl,
  onEmail,
  onWhatsapp,
}: {
  mode: ApplicationMode;
  url: string;
  email: string;
  whatsapp: string;
  onMode: (mode: ApplicationMode) => void;
  onUrl: (value: string) => void;
  onEmail: (value: string) => void;
  onWhatsapp: (value: string) => void;
}) {
  return (
    <>
      <fieldset className={styles.field}>
        <legend>Candidatura</legend>
        <div className={styles.choices} role="radiogroup" aria-label="Modalidade de candidatura">
          {APPLICATION_MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choice} ${mode === option.value ? styles.choiceOn : ""}`}
              aria-pressed={mode === option.value}
              onClick={() => onMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {mode === "INTERNAL" ? (
          <span className={styles.help}>
            A candidatura fica registrada no Recruta Indústria. Os outros contatos desta vaga não são exibidos.
          </span>
        ) : null}
      </fieldset>

      {mode === "EXTERNAL" ? (
        <label className={styles.field}>
          Link oficial para candidatura
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => onUrl(event.target.value)}
            maxLength={500}
            placeholder="https://empresa.com.br/vaga"
          />
          <span className={styles.help}>
            Obrigatório para publicar. O profissional acessa este endereço para concluir a candidatura. O Recruta Indústria não preenche o site da empresa.
          </span>
        </label>
      ) : null}

      {mode === "EMAIL" ? (
        <label className={styles.field}>
          E-mail para receber os currículos
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(event) => onEmail(event.target.value)}
            maxLength={254}
            placeholder="recrutamento@empresa.com.br"
          />
          <span className={styles.help}>
            Obrigatório para publicar. O endereço não aparece na página pública. O profissional Free copia este e-mail e envia o currículo por conta própria. O Premium envia o currículo automaticamente, sem exibir o endereço.
          </span>
        </label>
      ) : null}

      {mode === "WHATSAPP" ? (
        <label className={styles.field}>
          WhatsApp para receber os currículos
          <input
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={whatsapp}
            onChange={(event) => onWhatsapp(event.target.value)}
            maxLength={40}
            placeholder="(11) 98888-7777"
          />
          <span className={styles.help}>
            Obrigatório para publicar. O número não aparece na página pública. Não há envio automático: o profissional copia o número e envia a mensagem por conta própria.
          </span>
        </label>
      ) : null}
    </>
  );
}
