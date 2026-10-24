"use client";

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
        title="Máquinas e equipamentos"
        marcador="recomendado"
        defaultOpen={maquinasOpen}
        editar={edicao ? { aberto: edicao.aberto("maquinas"), onEditar: () => edicao.onEditar("maquinas") } : undefined}
      >
        <CheckboxGroup
          legend="Equipamentos que você opera"
          options={MAQUINAS_EQUIPAMENTOS}
          selected={formData.maquinasEquipamentos}
          onChange={(maquinasEquipamentos) => patch({ maquinasEquipamentos })}
        />
      </RegisterCollapsibleSection>

      <RegisterCollapsibleSection
        emoji="📋"
        title="Qualidade e processos"
        marcador="recomendado"
        defaultOpen={qualidadeOpen}
        editar={edicao ? { aberto: edicao.aberto("qualidade"), onEditar: () => edicao.onEditar("qualidade") } : undefined}
      >
        <CheckboxGroup
          legend="Conhecimentos em qualidade"
          options={QUALIDADE_PROCESSOS}
          selected={formData.qualidadeProcessos}
          onChange={(qualidadeProcessos) => patch({ qualidadeProcessos })}
        />
      </RegisterCollapsibleSection>

      <RegisterCollapsibleSection
        emoji="💻"
        title="Informática"
        marcador="recomendado"
        defaultOpen={infoOpen}
        editar={edicao ? { aberto: edicao.aberto("informatica"), onEditar: () => edicao.onEditar("informatica") } : undefined}
      >
        <CheckboxGroup
          legend="Conhecimentos em informática"
          options={INFORMATICA_OPCOES}
          selected={formData.informatica}
          onChange={(informatica) => patch({ informatica })}
        />
      </RegisterCollapsibleSection>
    </>
  );
}
