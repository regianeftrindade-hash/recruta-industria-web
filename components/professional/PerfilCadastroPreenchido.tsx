import DeleteAccountControl from "@/components/shared/DeleteAccountControl";

type Campo = { label: string; value: string };

export default function PerfilCadastroPreenchido({
  nome,
  email,
  campos,
}: {
  nome: string;
  email: string;
  campos: Campo[];
}) {
  const linhas = [
    { label: "Nome completo", value: nome },
    { label: "E-mail", value: email },
    { label: "Senha", value: "Cadastrada. Use este e-mail e a senha para entrar quando quiser." },
    ...campos.filter((campo) => campo.value.trim() && campo.value.trim() !== "—"),
  ];

  return (
    <section
      style={{
        padding: 16,
        border: "2px solid #8D6B1F",
        borderRadius: 16,
        background: "#E8D5A3",
        color: "#414141",
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Seu cadastro</h2>
      <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.4 }}>
        Estes são os dados da sua conta. A senha fica guardada e não é mostrada.
      </p>
      <dl style={{ margin: 0, display: "grid", gap: 10 }}>
        {linhas.map((linha) => (
          <div key={linha.label}>
            <dt style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {linha.label}
            </dt>
            <dd style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700 }}>{linha.value}</dd>
          </div>
        ))}
      </dl>
      <div style={{ marginTop: 16 }}>
        <DeleteAccountControl variant="compact" />
      </div>
    </section>
  );
}
