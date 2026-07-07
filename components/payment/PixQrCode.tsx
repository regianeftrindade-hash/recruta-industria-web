"use client";

import React, { useState } from "react";

type PixQrCodeProps = {
  copyPasteKey: string;
  qrCodeDataUrl?: string;
  expiresAt?: string;
};

export function PixQrCode({ copyPasteKey, qrCodeDataUrl, expiresAt }: PixQrCodeProps) {
  const [copied, setCopied] = useState(false);

  const imgSrc =
    qrCodeDataUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(copyPasteKey)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyPasteKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#C89B3C", fontWeight: 700, margin: "0 0 12px", fontSize: 14 }}>
        Escaneie o QR Code ou copie o código Pix
      </p>
      <img
        src={imgSrc}
        alt="QR Code Pix"
        width={280}
        height={280}
        style={{
          width: "100%",
          maxWidth: 280,
          height: "auto",
          margin: "0 auto",
          display: "block",
          borderRadius: 8,
          background: "#fff",
          padding: 8,
        }}
      />
      <button
        type="button"
        onClick={handleCopy}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          borderRadius: 6,
          border: "1px solid #8D6B1F",
          background: copied ? "#1a3d1a" : "#000",
          color: copied ? "#8f8" : "#F2F2F2",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>
      <p
        style={{
          fontSize: 10,
          wordBreak: "break-all",
          background: "#000",
          padding: 10,
          borderRadius: 6,
          marginTop: 12,
          color: "#aaa",
          lineHeight: 1.4,
        }}
      >
        {copyPasteKey}
      </p>
      {expiresAt && (
        <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
          Válido até: {new Date(expiresAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
