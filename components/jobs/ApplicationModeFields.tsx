"use client";

import { APPLICATION_MODES, type ApplicationMode } from "@/lib/jobs/job-posting";
import styles from "@/app/admin/vagas/vagas-admin.module.css";

export default function ApplicationModeFields({
  mode,
  url,
  email,
  onMode,
  onUrl,
  onEmail,
}: {
  mode: ApplicationMode;
  url: string;
  email: string;
  onMode: (mode: ApplicationMode) => void;
  onUrl: (value: string) => void;
  onEmail: (value: string) => void;
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
            Obrigatório para publicar. O profissional abre este endereço em uma nova aba.
          </span>
        </label>
      ) : null}

      {mode === "EMAIL" ? (
        <label className={styles.field}>
          E-mail da empresa para receber candidaturas
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmail(event.target.value)}
            maxLength={254}
            placeholder="recrutamento@empresa.com.br"
          />
          <span className={styles.help}>
            Obrigatório para publicar. O profissional envia a candidatura por este e-mail sem abrir o próprio correio.
          </span>
        </label>
      ) : null}
    </>
  );
}
