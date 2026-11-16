"use client";

import { t } from "@/lib/i18n/translate";
import React from "react";
import styles from "./register.module.css";
import RegisterCollapsibleSection from "@/components/ui/RegisterCollapsibleSection";
import { CheckboxGroup } from "@/app/components/RegisterSectionHeader";
import {
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
  INFORMATICA_OPCOES,
} from "@/lib/professional-form-config";

export type ExtendedFormFields = {
  maquinasEquipamentos: string[];
  qualidadeProcessos: string[];
  informatica: string[];
};

type Props = {
  formData: ExtendedFormFields;
  setFormData: React.Dispatch<React.SetStateAction<ExtendedFormFields & Record<string, unknown>>>;
  edicao?: {
    aberto: (id: string) => boolean;
    onEditar: (id: string) => void;
  } | null;
};

export default function RegisterExtendedSections({
  formData,
  setFormData,
  edicao = null,
}: Props) {
  const patch = (partial: Partial<ExtendedFormFields>) =>
    setFormData((prev) => ({ ...prev, ...partial }));

  const maquinasOpen = formData.maquinasEquipamentos.length > 0;
  const qualidadeOpen = formData.qualidadeProcessos.length > 0;
  const infoOpen = formData.informatica.length > 0;

  return (
    <>
      <RegisterCollapsibleSection
        emoji="⚙️"
        title={t("registration.ui.maquinas-e-equipamentos")}
        marcador="recomendado"
        defaultOpen={maquinasOpen}
        editar={edicao ? { aberto: edicao.aberto("maquinas"), onEditar: () => edicao.onEditar("maquinas") } : undefined}
      >
        <CheckboxGroup
          legend={t("registration.ui.equipamentos-que-voce-opera")}
          options={MAQUINAS_EQUIPAMENTOS}
          selected={formData.maquinasEquipamentos}
          onChange={(maquinasEquipamentos) => patch({ maquinasEquipamentos })}
        />
      </RegisterCollapsibleSection>

      <RegisterCollapsibleSection
        emoji="📋"
        title={t("registration.ui.qualidade-e-processos")}
        marcador="recomendado"
        defaultOpen={qualidadeOpen}
        editar={edicao ? { aberto: edicao.aberto("qualidade"), onEditar: () => edicao.onEditar("qualidade") } : undefined}
      >
        <CheckboxGroup
          legend={t("registration.ui.conhecimentos-em-qualidade")}
          options={QUALIDADE_PROCESSOS}
          selected={formData.qualidadeProcessos}
          onChange={(qualidadeProcessos) => patch({ qualidadeProcessos })}
        />
      </RegisterCollapsibleSection>

      <RegisterCollapsibleSection
        emoji="💻"
        title={t("registration.ui.informatica")}
        marcador="recomendado"
        defaultOpen={infoOpen}
        editar={edicao ? { aberto: edicao.aberto("informatica"), onEditar: () => edicao.onEditar("informatica") } : undefined}
      >
        <CheckboxGroup
          legend={t("registration.ui.conhecimentos-em-informatica")}
          options={INFORMATICA_OPCOES}
          selected={formData.informatica}
          onChange={(informatica) => patch({ informatica })}
        />
      </RegisterCollapsibleSection>
    </>
  );
}
