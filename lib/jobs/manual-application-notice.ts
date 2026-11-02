/**
 * Aviso temporário de uma vaga só.
 * A candidatura fica registrada no Recruta e não é enviada por e-mail.
 */
export const MANUAL_APPLICATION_JOB_ID = "cmluxprod20261102manual1";

export const MANUAL_APPLICATION_MESSAGE =
  "CANDIDATURA ENVIADA, POIS ENVIAREI MANUALMENTE";

export const MANUAL_APPLICATION_RESUME_MESSAGE =
  "Para se candidatar a esta vaga, conclua o cadastro e tenha um currículo em PDF. Você pode anexar o PDF ou criar o currículo em PDF aqui no site.";

export const MANUAL_APPLICATION_REGISTRATION_MESSAGE =
  "Conclua o cadastro de profissional antes de se candidatar a esta vaga.";

export const MANUAL_APPLICATION_EMAIL_SUBJECT = "Produção";

export function manualApplicationMessage(jobId: string | null | undefined): string | null {
  if (jobId !== MANUAL_APPLICATION_JOB_ID) return null;
  return MANUAL_APPLICATION_MESSAGE;
}
