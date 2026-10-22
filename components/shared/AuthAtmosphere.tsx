/** Fundo industrial compartilhado (home/login) — páginas de autenticação e pagamento. */
export function AuthAtmosphere({
  intensity = "default",
}: {
  /** `strong` = solda e brilho mais visíveis (cadastros / boas-vindas). */
  intensity?: "default" | "strong";
}) {
  void intensity;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "#F3E6C8",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 45% at 50% 12%, rgba(243,230,200,0.7), transparent 62%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
