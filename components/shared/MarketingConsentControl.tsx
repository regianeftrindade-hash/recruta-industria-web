"use client";

import React, { useEffect, useState } from "react";
import { exactUi } from "@/lib/i18n/exact-ui";
import { localizeServerText } from "@/lib/i18n/server-text";
import { t } from "@/lib/i18n/translate";
import { DASH } from "@/lib/dashboard-theme";

/**
 * Consentimento de marketing da conta: opcional, retirável, com data registrada no servidor.
 */
export default function MarketingConsentControl() {
  const [granted, setGranted] = useState(false);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/marketing-consent", { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          granted?: boolean;
          recordedAt?: string | null;
          error?: string;
        };
        if (!cancelled && res.ok) {
          setGranted(Boolean(data.granted));
          setRecordedAt(data.recordedAt ?? null);
        }
      } catch {
        // silencioso no load
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (next: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/marketing-consent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granted: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        granted?: boolean;
        recordedAt?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(localizeServerText(data.error) || exactUi("Não foi possível atualizar o consentimento."));
        return;
      }
      setGranted(Boolean(data.granted));
      setRecordedAt(data.recordedAt ?? null);
    } catch {
      setError(exactUi("Erro de rede ao atualizar o consentimento."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${DASH.border}`,
        background: DASH.card,
        fontSize: 11,
        color: DASH.muted,
        maxWidth: 320,
      }}
    >
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={granted}
          disabled={saving}
          onChange={(e) => void save(e.target.checked)}
        />
        <span>
          {t("privacy.marketingConsentOptional") ||
            "Aceito receber comunicações de marketing (opcional). Posso retirar depois."}
        </span>
      </label>
      {recordedAt ? (
        <p style={{ margin: "6px 0 0", fontSize: 10 }}>
          {t("privacy.marketingConsentRecordedAt") || "Último registro:"}{" "}
          {new Date(recordedAt).toLocaleString("pt-BR")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ margin: "6px 0 0", color: "#b71c1c", fontSize: 10 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
