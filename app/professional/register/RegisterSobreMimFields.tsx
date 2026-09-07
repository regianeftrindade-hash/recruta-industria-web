"use client";

import React from "react";
import {
  SOBRE_MIM_CAMPOS,
  SOBRE_MIM_LIMITES,
  type SobreMimData,
} from "@/lib/sobre-mim";
import styles from "./register.module.css";

type Props = {
  value: SobreMimData;
  onChange: (campo: keyof SobreMimData, val: string) => void;
};

export default function RegisterSobreMimFields({ value, onChange }: Props) {
  return (
    <div className={styles.sobreMimGrid}>
      {SOBRE_MIM_CAMPOS.map(({ key, label, placeholder }) => {
        const maxLength = SOBRE_MIM_LIMITES[key];
        const campoValor = value[key];

        return (
          <div key={key} className={styles.sobreMimCampo}>
            <div className={styles.sobreMimCampoTopo}>
              <label className={styles.label} htmlFor={`sobreMim-${key}`}>
                {label}
              </label>
              <span className={styles.sobreMimContador}>
                {campoValor.length}/{maxLength}
              </span>
            </div>
            <input
              id={`sobreMim-${key}`}
              type="text"
              className={styles.input}
              value={campoValor}
              maxLength={maxLength}
              placeholder={placeholder}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
