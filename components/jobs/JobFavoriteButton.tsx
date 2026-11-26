"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BandeiraFavoritoIcon from "@/components/company/BandeiraFavoritoIcon";
import { t } from "@/lib/i18n/translate";

export default function JobFavoriteButton({
  jobId,
  ativo = false,
  retorno,
  carregar = false,
  onChange,
}: {
  jobId: string;
  ativo?: boolean;
  retorno: string;
  carregar?: boolean;
  onChange?: (favorited: boolean) => void;
}) {
  const router = useRouter();
  const [marcado, setMarcado] = useState(ativo);
  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState("");

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
    setAviso("");
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
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAviso(typeof data.error === "string" && data.error ? data.error : t("rest.jobs.favoriteFailed"));
        return;
      }
      const salvo = Boolean(data.favorited);
      if (proximo && !salvo) {
        setMarcado(false);
        onChange?.(false);
        setAviso(t("rest.jobs.favoriteUnavailable"));
        return;
      }
      setMarcado(salvo);
      onChange?.(salvo);
    } catch {
      setAviso(t("rest.jobs.favoriteFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        type="button"
        className="ri-btn-3d-gold"
        aria-pressed={marcado}
        aria-label={marcado ? t("rest.jobs.removeFavorite") : t("rest.jobs.addFavorite")}
        title={marcado ? t("rest.jobs.removeFavorite") : t("rest.jobs.addFavorite")}
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
        {marcado ? t("rest.jobs.favorite") : t("rest.jobs.favoritar")}
      </button>
      {aviso ? (
        <span role="alert" style={{ color: "#414141", fontSize: 12, fontWeight: 700, maxWidth: 220 }}>
          {aviso}
        </span>
      ) : null}
    </span>
  );
}
