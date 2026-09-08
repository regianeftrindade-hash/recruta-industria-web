/** Fundo industrial compartilhado (home/login) — páginas de autenticação e pagamento. */
export function AuthAtmosphere() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(58,58,58,0.78) 0%, rgba(43,43,43,0.9) 50%, rgba(58,58,58,0.96) 100%), url(/welding-left.png) left center / cover no-repeat, url(/welding-right.png) right center / cover no-repeat, #3a3a3a",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(200,155,60,0.14), transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
