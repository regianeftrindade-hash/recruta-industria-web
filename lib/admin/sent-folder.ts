export type PastaDeCorreio = {
  path: string;
  name?: string | null;
  specialUse?: string | null;
};

function usoEspecial(value: string | null | undefined): string {
  return String(value || "").replace(/\\/g, "").trim().toLowerCase();
}

function igual(left: string | null | undefined, right: string): boolean {
  return String(left || "").trim().toLowerCase() === right.toLowerCase();
}

const NOMES_CONHECIDOS = [
  "INBOX.Sent",
  "Sent",
  "INBOX.Enviados",
  "Enviados",
  "Sent Items",
  "Sent Messages",
];

/** Escolhe a pasta Enviados da caixa. A Hostinger costuma marcá-la como \Sent. */
export function escolherPastaEnviados(pastas: PastaDeCorreio[]): string | null {
  const marcada = pastas.find((pasta) => usoEspecial(pasta.specialUse) === "sent" && pasta.path);
  if (marcada) return marcada.path;

  for (const nome of NOMES_CONHECIDOS) {
    const encontrada = pastas.find((pasta) => igual(pasta.path, nome) || igual(pasta.name, nome));
    if (encontrada?.path) return encontrada.path;
  }

  const parecida = pastas.find((pasta) => /(^|[./])(sent|enviados)$/i.test(pasta.path || ""));
  return parecida?.path || null;
}
