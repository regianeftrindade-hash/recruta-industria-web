"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function SuccessProfessional() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card} role="main" aria-labelledby="success-title">
        <div className={styles.visual}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={styles.svgIcon} role="img" aria-label="Ícone de trabalhador">
            <rect x="6" y="22" width="52" height="30" rx="3" fill="var(--primary-color)" opacity="0.12" />
            <path d="M8 34h48v10H8z" fill="var(--primary-color)" />
            <circle cx="20" cy="16" r="6" fill="var(--primary-color)" />
            <circle cx="44" cy="16" r="6" fill="var(--primary-color)" />
            <rect x="16" y="10" width="8" height="12" fill="var(--primary-color)" />
            <rect x="40" y="10" width="8" height="12" fill="var(--primary-color)" />
          </svg>
        </div>

        <h1 id="success-title" className={styles.title}>Perfil criado!</h1>

        <p className={styles.description}>Seu perfil foi criado com sucesso! Agora as empresas podem encontrá-lo na região.</p>

        <div role="status" aria-live="polite" className={styles.live}>Perfil criado com sucesso.</div>

        <div className={styles.actions}>
          <button
            className={styles.primary}
            onClick={() => router.push('/professional/dashboard')}
            aria-label="Ver meu painel"
          >
            Ver meu painel
          </button>
        </div>

        <p className={styles.note}>
          <span className={styles.srOnly}>Dica:</span> Você pode editar seu perfil e preferências no painel.
        </p>
      </div>
    </div>
  );
}