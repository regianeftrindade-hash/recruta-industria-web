"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BandeiraFavoritoIcon from "@/components/company/BandeiraFavoritoIcon";

export default function JobFavoriteButton({
  jobId,
  ativo = false,
  retorno,
  carregar = false,
}: {
  jobId: string;
  ativo?: boolean;
  retorno: string;
  carregar?: boolean;
}) {
  const router = useRouter();
  const [marcado, setMarcado] = useState(ativo);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!carregar) setMarcado(ativo);
  }, [ativo, carregar]);

  useEffect(() => {
    if (!carregar) return;
    let cancelado = false;
    void fetch(`/api/professional/vagas/favoritos?jobId=${encodeURIComponent(jobId)}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelado && data) setMarcado(Boolean(data.favorited));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [carregar, jobId]);

  async function alternar() {
    setBusy(true);
    const proximo = !marcado;
    try {
      const response = await fetch("/api/professional/vagas/favoritos", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, favorited: proximo }),
      });
      if (response.status === 401 || response.status === 403) {
        router.push(`/login?tipo=profissional&redirect=${encodeURIComponent(retorno)}`);
        return;
      }
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));
      setMarcado(Boolean(data.favorited));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="ri-btn-3d-gold"
      aria-pressed={marcado}
      aria-label={marcado ? "Remover dos favoritos" : "Marcar como favorito"}
      title={marcado ? "Remover dos favoritos" : "Marcar como favorito"}
      disabled={busy}
      onClick={() => void alternar()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 13,
      }}
    >
      <BandeiraFavoritoIcon ativo={marcado} size={16} />
      {marcado ? "Favorito" : "Favoritar"}
    </button>
  );
}
