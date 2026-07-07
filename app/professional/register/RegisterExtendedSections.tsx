"use client";

import React from "react";
import styles from "./register.module.css";
import RegisterSectionHeader, { CheckboxGroup } from "@/app/components/RegisterSectionHeader";
import {
  SEGMENTOS_INDUSTRIA,
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
  INFORMATICA_OPCOES,
  PREFIRO_NAO_INFORMAR,
} from "@/lib/professional-form-config";

export type ExtendedFormFields = {
  segmentosIndustria: string[];
  maquinasEquipamentos: string[];
  qualidadeProcessos: string[];
  informatica: string[];
  aceitaViagens: string;
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
      <section>
        <CheckboxGroup legend="Segmentos em que trabalhou" options={SEGMENTOS_INDUSTRIA} selected={formData.segmentosIndustria} onChange={(segmentosIndustria) => patch({ segmentosIndustria })} />
      </section>

      <section>
        <RegisterSectionHeader emoji="⚙️" title="Máquinas e equipamentos" />
        <CheckboxGroup legend="Equipamentos que você opera" options={MAQUINAS_EQUIPAMENTOS} selected={formData.maquinasEquipamentos} onChange={(maquinasEquipamentos) => patch({ maquinasEquipamentos })} />
      </section>

      <section>
        <RegisterSectionHeader emoji="📋" title="Qualidade e processos" />
        <CheckboxGroup legend="Conhecimentos em qualidade" options={QUALIDADE_PROCESSOS} selected={formData.qualidadeProcessos} onChange={(qualidadeProcessos) => patch({ qualidadeProcessos })} />
      </section>

      <section>
        <RegisterSectionHeader emoji="💻" title="Informática" />
        <CheckboxGroup legend="Conhecimentos em informática" options={INFORMATICA_OPCOES} selected={formData.informatica} onChange={(informatica) => patch({ informatica })} />
      </section>

      <section>
        <RegisterSectionHeader emoji="📍" title="Viagens" />
        <label className={styles.label} htmlFor="aceitaViagens">Aceita viagens?</label>
        <select id="aceitaViagens" className={styles.select} value={formData.aceitaViagens} onChange={(e) => patch({ aceitaViagens: e.target.value })}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Dependendo">Dependendo</option>
          <option value={PREFIRO_NAO_INFORMAR}>{PREFIRO_NAO_INFORMAR}</option>
        </select>
      </section>
    </>
  );
}
