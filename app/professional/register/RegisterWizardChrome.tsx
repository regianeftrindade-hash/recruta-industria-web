"use client";

import styles from "./register.module.css";

export const REGISTER_WIZARD_STEPS = [
  { id: "essenciais", label: "Essenciais" },
  { id: "carreira", label: "Carreira" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "finalizar", label: "Finalizar" },
] as const;

type Props = {
  step: number;
  onStepChange: (step: number) => void;
  /** Continuar / avançar — retorna false para bloquear (validação da etapa). */
  onContinue?: () => boolean;
};

/** Indicador + navegação do cadastro em etapas (só no modo novo cadastro). */
export default function RegisterWizardChrome({ step, onStepChange, onContinue }: Props) {
  const last = REGISTER_WIZARD_STEPS.length - 1;

  const irPara = (target: number) => {
    if (target === step) return;
    if (target < step) {
      onStepChange(target);
      return;
    }
    if (target > step + 1) return;
    if (onContinue && !onContinue()) return;
    onStepChange(Math.min(last, step + 1));
  };

  return (
    <div className={styles.wizardChrome}>
      <ol className={styles.wizardSteps} aria-label="Etapas do cadastro">
        {REGISTER_WIZARD_STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`${styles.wizardStepBtn}${active ? ` ${styles.wizardStepBtnActive}` : ""}${done ? ` ${styles.wizardStepBtnDone}` : ""}`}
                aria-current={active ? "step" : undefined}
                onClick={() => irPara(i)}
              >
                <span className={styles.wizardStepNum}>{i + 1}</span>
                <span className={styles.wizardStepLabel}>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.wizardNav}>
        <button
          type="button"
          className={styles.wizardNavBtn}
          disabled={step <= 0}
          onClick={() => onStepChange(Math.max(0, step - 1))}
        >
          Voltar
        </button>
        <button
          type="button"
          className={styles.wizardNavBtnPrimary}
          disabled={step >= last}
          onClick={() => irPara(step + 1)}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
