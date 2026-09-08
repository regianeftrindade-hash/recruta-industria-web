"use client";

import React, { useState } from "react";
import { dashInput, dashLabel } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { maskReaisInput, TURNOS_PROPOSTA } from "@/lib/format-reais";

type Props = {
  profileId: string;
  onChanged: () => void;
};

export default function CompanyEnviarPropostaForm({ profileId, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cargo: "",
    salario: "",
    turno: "",
    cidade: "",
    beneficios: "",
    mensagem:
      "Gostamos do seu perfil e gostaríamos de saber se você tem interesse nesta oportunidade.",
  });

  const enviarProposta = async () => {
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
        alert(data.error || "Erro ao enviar proposta");
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
      onChanged();
      alert("Proposta enviada! O profissional receberá no painel e por e-mail.");
    } catch {
      alert("Erro ao enviar proposta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        style={{ ...btnGold, width: "100%", padding: "10px 14px", fontSize: 13, marginBottom: 12 }}
      >
        {showForm ? "Fechar formulário" : "Enviar Proposta"}
      </button>

      {showForm && (
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          <div>
            <p style={dashLabel}>Cargo</p>
            <input
              value={form.cargo}
              placeholder="Inspetor de Qualidade"
              onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              style={dashInput}
            />
          </div>
          <div>
            <p style={dashLabel}>Salário (R$)</p>
            <input
              value={form.salario}
              placeholder="R$ 4.200"
              inputMode="numeric"
              onChange={(e) => setForm((f) => ({ ...f, salario: maskReaisInput(e.target.value) }))}
              style={dashInput}
            />
          </div>
          <div>
            <p style={dashLabel}>Turno</p>
            <select
              value={form.turno}
              onChange={(e) => setForm((f) => ({ ...f, turno: e.target.value }))}
              style={dashInput}
            >
              <option value="">Selecione</option>
              {TURNOS_PROPOSTA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p style={dashLabel}>Cidade</p>
            <input
              value={form.cidade}
              placeholder="Campinas/SP"
              onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
              style={dashInput}
            />
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
              onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
              style={{ ...dashInput, resize: "vertical" }}
            />
          </div>
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
    </>
  );
}
