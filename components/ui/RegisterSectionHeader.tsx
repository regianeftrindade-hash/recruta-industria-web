"use client";

import React from "react";
import styles from "@/app/professional/register/register.module.css";

interface RegisterSectionHeaderProps {
  emoji: string;
  title: string;
}

export default function RegisterSectionHeader({ emoji, title }: RegisterSectionHeaderProps) {
  return (
    <h2 className={styles.sectionTitle}>
      {emoji} {title}
    </h2>
  );
}

export function CheckboxGroup({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className={styles.checkboxFieldset}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.checkboxGrid}>
        {options.map((opt) => (
          <label key={opt} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
              }}
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
