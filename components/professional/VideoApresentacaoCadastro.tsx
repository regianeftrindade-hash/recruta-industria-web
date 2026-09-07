"use client";

import React from "react";
import VideoApresentacaoSection from "@/components/professional/VideoApresentacaoSection";
import styles from "@/app/professional/register/register.module.css";

export default function VideoApresentacaoCadastro() {
  return (
    <div className={styles.videoApresentacaoWrap}>
      <VideoApresentacaoSection compact thumbnailOnly />
    </div>
  );
}
