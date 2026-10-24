"use client";

import { fotoPerfilSrc } from "@/lib/professional/foto-perfil";

/** Foto redonda do profissional. Sem arquivo, mostra o boneco. */
export default function FotoPerfilAvatar({
  value,
  size = 36,
  alt = "",
}: {
  value?: string | null;
  size?: number;
  alt?: string;
}) {
  const src = fotoPerfilSrc(value);
  const box = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    border: "2px solid #8D6B1F",
  } as const;

  if (!src) {
    return (
      <span
        aria-hidden
        style={{
          ...box,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E8D5A3",
          fontSize: Math.max(12, Math.round(size * 0.46)),
          lineHeight: 1,
        }}
      >
        👤
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      style={{ ...box, display: "block", objectFit: "cover" }}
    />
  );
}
