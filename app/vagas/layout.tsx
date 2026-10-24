export default function VagasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          height: auto !important;
          min-height: 100%;
        }
      `}</style>
      {children}
    </>
  );
}
