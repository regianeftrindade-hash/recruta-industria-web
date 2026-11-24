/**
 * Ajustes lexicais BR → PT europeu para entradas ainda idênticas ao pt-BR.
 * Não altera endereços de e-mail (texto com @).
 */
const SAFE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSenha\b/g, "Palavra-passe"],
  [/\bsenha\b/g, "palavra-passe"],
  [/\bCelular\b/g, "Telemóvel"],
  [/\bcelular\b/g, "telemóvel"],
  [/\bUsuário\b/g, "Utilizador"],
  [/\busuário\b/g, "utilizador"],
  [/\bArquivo\b/g, "Ficheiro"],
  [/\barquivo\b/g, "ficheiro"],
  [/\bCadastre-se\b/g, "Registe-se"],
  [/\bcadastre-se\b/g, "registe-se"],
  [/\bCadastrar\b/g, "Registar"],
  [/\bcadastrar\b/g, "registar"],
  [/\bCadastro\b/g, "Registo"],
  [/\bcadastro\b/g, "registo"],
  [/\bContato\b/g, "Contacto"],
  [/\bcontato\b/g, "contacto"],
  [/\bgrava-la\b/g, "gravá-la"],
];

/** Aplica europeização lexical segura. */
export function europeanizePtPt(text: string): string {
  if (text.includes("@")) return text;
  let out = text;
  for (const [pattern, replacement] of SAFE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
