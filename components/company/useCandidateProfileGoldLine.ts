"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

type GoldLine = {
  width: number;
  height: number;
  d: string;
};

export function useCandidateProfileGoldLine(deps: {
  resumo: unknown;
  videoApresentacaoUrl: string | null;
  loading: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const lineGradId = useId();
  const [goldLine, setGoldLine] = useState<GoldLine | null>(null);

  useLayoutEffect(() => {
    const updateLine = () => {
      const root = headerRef.current;
      const info = infoRef.current;
      if (!root || !info) {
        setGoldLine(null);
        return;
      }
      if (window.matchMedia("(max-width: 900px)").matches) {
        setGoldLine(null);
        return;
      }

      const rootBox = root.getBoundingClientRect();
      const infoBox = info.getBoundingClientRect();
      const video = videoRef.current;
      const videoBox = video?.getBoundingClientRect();

      const startX = Math.max(8, infoBox.left - rootBox.left);
      const lineY = infoBox.bottom - rootBox.top + 6;
      const tipRise = 10;

      let d: string;
      let height: number;

      if (videoBox) {
        const videoLeft = videoBox.left - rootBox.left;
        // Reta sob o texto, colada no vídeo — sem curva no fim
        const horizEnd = Math.max(startX + 40, videoLeft);
        d = [
          `M ${startX - 6} ${lineY - tipRise}`,
          `Q ${startX - 6} ${lineY} ${startX + 10} ${lineY}`,
          `L ${horizEnd} ${lineY}`,
        ].join(" ");
        height = Math.ceil(lineY + tipRise + 8);
      } else {
        const endX = infoBox.right - rootBox.left;
        d = [
          `M ${startX - 6} ${lineY - tipRise}`,
          `Q ${startX - 6} ${lineY} ${startX + 10} ${lineY}`,
          `L ${endX} ${lineY}`,
        ].join(" ");
        height = Math.ceil(lineY + tipRise + 8);
      }

      setGoldLine({
        width: Math.ceil(rootBox.width),
        height: Math.max(height, Math.ceil(rootBox.height) + 20),
        d,
      });
    };

    updateLine();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateLine) : null;
    if (headerRef.current) ro?.observe(headerRef.current);
    if (infoRef.current) ro?.observe(infoRef.current);
    if (videoRef.current) ro?.observe(videoRef.current);
    window.addEventListener("resize", updateLine);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateLine);
    };
  }, [deps.resumo, deps.videoApresentacaoUrl, deps.loading]);

  return { headerRef, infoRef, videoRef, lineGradId, goldLine };
}
