/**
 * Aviso temporário de uma vaga só.
 * A candidatura fica registrada no Recruta e não é enviada por e-mail.
 */
export const MANUAL_APPLICATION_JOB_ID = "cmluxprod20261102manual1";

export const MANUAL_APPLICATION_MESSAGE =
  "CANDIDATURA ENVIADA, POIS ENVIAREI MANUALMENTE";

export const MANUAL_APPLICATION_RESUME_MESSAGE =
  "Para se candidatar a esta vaga, é obrigatório um currículo: anexe um PDF, anexe o seu currículo pessoal em DOCX, ou crie o currículo aqui no site.";

export function manualApplicationMessage(jobId: string | null | undefined): string | null {
  if (jobId !== MANUAL_APPLICATION_JOB_ID) return null;
  return MANUAL_APPLICATION_MESSAGE;
}
