"use client";

import React from "react";
import styles from "./register.module.css";
import RegisterSectionHeader, { CheckboxGroup } from "@/app/components/RegisterSectionHeader";
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
};

export default function RegisterExtendedSections({
  formData,
  setFormData,
}: Props) {
  const patch = (partial: Partial<ExtendedFormFields>) =>
    setFormData((prev) => ({ ...prev, ...partial }));

  return (
    <>
      <section className={styles.sectionCard}>
        <RegisterSectionHeader emoji="⚙️" title="Máquinas e equipamentos" />
        <CheckboxGroup legend="Equipamentos que você opera" options={MAQUINAS_EQUIPAMENTOS} selected={formData.maquinasEquipamentos} onChange={(maquinasEquipamentos) => patch({ maquinasEquipamentos })} />
      </section>

      <section className={styles.sectionCard}>
        <RegisterSectionHeader emoji="📋" title="Qualidade e processos" />
        <CheckboxGroup legend="Conhecimentos em qualidade" options={QUALIDADE_PROCESSOS} selected={formData.qualidadeProcessos} onChange={(qualidadeProcessos) => patch({ qualidadeProcessos })} />
      </section>

      <section className={styles.sectionCard}>
        <RegisterSectionHeader emoji="💻" title="Informática" />
        <CheckboxGroup legend="Conhecimentos em informática" options={INFORMATICA_OPCOES} selected={formData.informatica} onChange={(informatica) => patch({ informatica })} />
      </section>
    </>
  );
}
