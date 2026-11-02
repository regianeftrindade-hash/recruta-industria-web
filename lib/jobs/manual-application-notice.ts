/**
 * Aviso temporário de uma vaga só.
 * A candidatura fica registrada no Recruta e não é enviada por e-mail.
 */
export const MANUAL_APPLICATION_JOB_ID = "cmluxprod20261102manual1";

export const MANUAL_APPLICATION_MESSAGE =
  "CANDIDATURA ENVIADA, POIS ENVIAREI MANUALMENTE";

export function manualApplicationMessage(jobId: string | null | undefined): string | null {
  if (jobId !== MANUAL_APPLICATION_JOB_ID) return null;
  return MANUAL_APPLICATION_MESSAGE;
}
