"use client";

import React, { useState } from "react";
import { DASH, dashInput, dashLabel } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { maskReaisInput, TURNOS_PROPOSTA, formatReaisDisplay } from "@/lib/format-reais";

type Props = {
  profileId: string;
  onChanged: () => void;
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    ...dashInput,
    border: hasError ? "1px solid #e57373" : dashInput.border,
  };
}

export default function CompanyEnviarPropostaForm({ profileId, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    cargo: "",
    salario: "",
    turno: "",
    cidade: "",
    beneficios: "",
    mensagem:
      "Gostamos do seu perfil e gostaríamos de saber se você tem interesse nesta oportunidade.",
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.cargo.trim()) next.cargo = "Informe o cargo.";
    const salarioFmt = formatReaisDisplay(form.salario.trim());
    if (!form.salario.trim() || salarioFmt === "—") next.salario = "Informe o salário em R$.";
    if (!form.turno.trim()) next.turno = "Selecione o turno.";
    if (!form.cidade.trim()) next.cidade = "Informe a cidade.";
    if (!form.mensagem.trim()) next.mensagem = "Escreva uma mensagem.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const enviarProposta = async () => {
    setError(null);
    setSuccess(null);
    if (!validate()) {
      setError("Preencha cargo, salário (R$), turno, cidade e mensagem.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/company/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao enviar proposta");
        return;
      }
      setShowForm(false);
      setForm((f) => ({
        ...f,
        cargo: "",
        salario: "",
        turno: "",
        cidade: "",
        beneficios: "",
      }));
      setFieldErrors({});
      setSuccess("Proposta enviada! O profissional receberá no painel e por e-mail.");
      onChanged();
    } catch {
      setError("Erro ao enviar proposta");
    } finally {
      setSaving(false);
    }
  };

  const fieldHint = (key: string) =>
    fieldErrors[key] ? (
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#e57373" }}>{fieldErrors[key]}</p>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShowForm((v) => !v);
          setError(null);
          setSuccess(null);
        }}
        style={{ ...btnGold, width: "100%", padding: "10px 14px", fontSize: 13, marginBottom: 12 }}
      >
        {showForm ? "Fechar formulário" : "Enviar Proposta"}
      </button>

      {success && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#8bc34a", lineHeight: 1.45 }}>{success}</p>
      )}

      {showForm && (
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          <div>
            <p style={dashLabel}>Cargo</p>
            <input
              value={form.cargo}
              placeholder="Inspetor de Qualidade"
              onChange={(e) => {
                setForm((f) => ({ ...f, cargo: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, cargo: "" }));
              }}
              style={inputStyle(Boolean(fieldErrors.cargo))}
            />
            {fieldHint("cargo")}
          </div>
          <div>
            <p style={dashLabel}>Salário (R$)</p>
            <input
              value={form.salario}
              placeholder="R$ 4.200"
              inputMode="numeric"
              onChange={(e) => {
                setForm((f) => ({ ...f, salario: maskReaisInput(e.target.value) }));
                setFieldErrors((fe) => ({ ...fe, salario: "" }));
              }}
              style={inputStyle(Boolean(fieldErrors.salario))}
            />
            {fieldHint("salario")}
          </div>
          <div>
            <p style={dashLabel}>Turno</p>
            <select
              value={form.turno}
              onChange={(e) => {
                setForm((f) => ({ ...f, turno: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, turno: "" }));
              }}
              style={inputStyle(Boolean(fieldErrors.turno))}
            >
              <option value="">Selecione</option>
              {TURNOS_PROPOSTA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {fieldHint("turno")}
          </div>
          <div>
            <p style={dashLabel}>Cidade</p>
            <input
              value={form.cidade}
              placeholder="Campinas/SP"
              onChange={(e) => {
                setForm((f) => ({ ...f, cidade: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, cidade: "" }));
              }}
              style={inputStyle(Boolean(fieldErrors.cidade))}
            />
            {fieldHint("cidade")}
          </div>
          <div>
            <p style={dashLabel}>Benefícios</p>
            <textarea
              value={form.beneficios}
              placeholder={"Convênio médico\nVA R$ 500\nPLR"}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, beneficios: e.target.value }))}
              style={{ ...dashInput, resize: "vertical" }}
            />
          </div>
          <div>
            <p style={dashLabel}>Mensagem</p>
            <textarea
              value={form.mensagem}
              rows={3}
              onChange={(e) => {
                setForm((f) => ({ ...f, mensagem: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, mensagem: "" }));
              }}
              style={{ ...inputStyle(Boolean(fieldErrors.mensagem)), resize: "vertical" }}
            />
            {fieldHint("mensagem")}
          </div>
          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "#e57373", lineHeight: 1.45 }}>{error}</p>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void enviarProposta()}
            style={{ ...btnGold, padding: "10px", fontSize: 13, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Enviando..." : "Enviar proposta"}
          </button>
        </div>
      )}

      {!showForm && error && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#e57373", lineHeight: 1.45 }}>{error}</p>
      )}
    </>
  );
}
