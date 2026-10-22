"use client";

import { APPLICATION_MODES, type ApplicationMode } from "@/lib/jobs/job-posting";
import styles from "@/app/admin/vagas/vagas-admin.module.css";

export default function ApplicationModeFields({
  mode,
  url,
  email,
  phone,
  onMode,
  onUrl,
  onEmail,
  onPhone,
}: {
  mode: ApplicationMode;
  url: string;
  email: string;
  phone: string;
  onMode: (mode: ApplicationMode) => void;
  onUrl: (value: string) => void;
  onEmail: (value: string) => void;
  onPhone: (value: string) => void;
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
            Obrigatório para publicar. O profissional é encaminhado para este endereço.
          </span>
        </label>
      ) : null}

      {mode === "EMAIL" ? (
        <label className={styles.field}>
          E-mail privado para receber os currículos
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
            Obrigatório para publicar. Este endereço não aparece na página pública. O currículo em PDF vai em anexo. Se o profissional não tiver PDF salvo, o perfil do site é enviado neste e-mail.
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
            value={phone}
            onChange={(event) => onPhone(event.target.value)}
            maxLength={20}
            placeholder="11 98888-7777"
          />
          <span className={styles.help}>
            Obrigatório para publicar. O número não aparece na página pública. O profissional envia o currículo do site, ou o aviso do PDF salvo, para este WhatsApp.
          </span>
        </label>
      ) : null}

      {mode === "INTERNAL" ? (
        <p className={styles.help}>
          A candidatura fica somente na página da empresa. Não é enviada por e-mail nem por WhatsApp.
        </p>
      ) : null}
    </>
  );
}
