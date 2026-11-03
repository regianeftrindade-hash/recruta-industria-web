/**
 * Aviso temporário de uma vaga só.
 * A candidatura fica registrada no Recruta e não é enviada por e-mail.
 */
export const MANUAL_APPLICATION_JOB_ID = "cmluxprod20261102manual1";

export const MANUAL_APPLICATION_MESSAGE =
  "CANDIDATURA ENVIADA, POIS ENVIAREI MANUALMENTE";

export const MANUAL_APPLICATION_RESUME_MESSAGE =
  "Para se candidatar a esta vaga, conclua o cadastro completo e tenha um currículo em PDF. O cadastro rápido não vale. Você pode anexar o PDF ou criar o currículo em PDF aqui no site.";

export const MANUAL_APPLICATION_REGISTRATION_MESSAGE =
  "Conclua o cadastro completo de profissional antes de se candidatar a esta vaga. O cadastro rápido não vale para esta vaga.";

export const MANUAL_APPLICATION_EMAIL_SUBJECT = "Produção";

/** Quem recebe o currículo quando o envio é feito pela administração. */
export const MANUAL_APPLICATION_CARE_OF = "Maria";

export const MANUAL_APPLICATION_DEADLINE = "05/11/2026";

export function manualApplicationCareOf(jobId: string | null | undefined): string | null {
  if (jobId !== MANUAL_APPLICATION_JOB_ID) return null;
  return MANUAL_APPLICATION_CARE_OF;
}

export function manualApplicationMessage(jobId: string | null | undefined): string | null {
  if (jobId !== MANUAL_APPLICATION_JOB_ID) return null;
  return MANUAL_APPLICATION_MESSAGE;
}
