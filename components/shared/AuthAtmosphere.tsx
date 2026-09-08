/** Fundo industrial compartilhado (home/login) — páginas de autenticação e pagamento. */
export function AuthAtmosphere({
  intensity = "default",
}: {
  /** `strong` = solda e brilho mais visíveis (cadastros / boas-vindas). */
  intensity?: "default" | "strong";
}) {
  const layerOpacity = intensity === "strong" ? 0.78 : 0.5;
  const glowAlpha = intensity === "strong" ? 0.22 : 0.14;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(58,58,58,0.72) 0%, rgba(43,43,43,0.88) 50%, rgba(58,58,58,0.94) 100%), url(/welding-left.png) left center / cover no-repeat, url(/welding-right.png) right center / cover no-repeat, #3a3a3a",
          opacity: layerOpacity,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 45% at 50% 12%, rgba(200,155,60,${glowAlpha}), transparent 62%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
