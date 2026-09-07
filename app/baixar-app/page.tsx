"use client";

import Link from "next/link";
import LogoRecruta from "@/app/components/LogoRecruta";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import styles from "./baixar-app.module.css";

export default function BaixarAppPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <LogoRecruta size="sm" as="h1" depth />
        <p className={styles.kicker}>Aplicativo Recruta Indústria</p>
        <h2 className={styles.title}>Instale o Recruta no celular</h2>
        <p className={styles.text}>
          O app abre em tela cheia, com ícone na lista de aplicativos. Use o Chrome no Android.
          No iPhone, a Apple só permite instalar pelo Safari até o app estar na App Store.
        </p>
        <InstallAppPrompt variant="banner" />
        <ol className={styles.steps}>
          <li>
            <strong>Android:</strong> Chrome → menu ⋮ → <strong>Instalar aplicativo</strong> → Instalar.
          </li>
          <li>
            <strong>iPhone:</strong> Safari → Compartilhar → <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>
            <strong>Computador:</strong> Chrome → ícone de instalar na barra de endereço.
          </li>
        </ol>
        <p className={styles.back}>
          <Link href="/">Voltar ao site</Link>
        </p>
      </div>
    </main>
  );
}
