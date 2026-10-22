"use client";

import { isWhatsAppApplyUrl } from "@/lib/jobs/public-job-link";
import styles from "./whatsapp-apply-handoff.module.css";

export default function WhatsAppApplyHandoff({
  jobId,
  url,
  hasResume,
  onClose,
}: {
  jobId: string;
  url: string;
  hasResume: boolean;
  onClose: () => void;
}) {
  const safeUrl = isWhatsAppApplyUrl(url) ? url : "";

  return (
    <div className={styles.panel}>
      <p>
        Você continuará sua candidatura pelo WhatsApp da empresa. Antes de enviar, anexe seu currículo PDF à conversa.
      </p>
      {hasResume ? (
        <a href="/api/professional/curriculo">Baixar meu currículo PDF</a>
      ) : (
        <>
          <p>
            Você ainda não tem um currículo PDF salvo. Pode enviar um arquivo agora ou anexar o PDF direto no WhatsApp.
          </p>
          <a href={`/vagas/${jobId}/curriculo`}>Enviar meu currículo PDF</a>
        </>
      )}
      {safeUrl ? <a href={safeUrl}>Abrir WhatsApp</a> : <p>Não foi possível preparar o WhatsApp desta vaga.</p>}
      <button type="button" onClick={onClose}>Voltar para a vaga</button>
    </div>
  );
}
