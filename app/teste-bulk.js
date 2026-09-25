const fs = require("fs");
const path = require("path");

// Cole aqui as URLs públicas do LinkedIn, uma por linha.
const urls = [
  "https://www.linkedin.com/in/exemplo-perfil-1/",
  "https://www.linkedin.com/in/exemplo-perfil-2/",
];

const urlDaRota = "https://recrutaindustria.com/api/integrations/datagma/profile";
const intervaloMs = 2000;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lerEnvLocal(nome) {
  const arquivo = path.join(__dirname, "..", ".env.local");
  const texto = fs.readFileSync(arquivo, "utf8");
  for (const linha of texto.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;
    const separador = limpa.indexOf("=");
    if (separador === -1) continue;
    const chave = limpa.slice(0, separador).trim();
    if (chave !== nome) continue;
    let valor = limpa.slice(separador + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    return valor;
  }
  return "";
}

const importarPerfis = async () => {
  const apiKey = lerEnvLocal("DATAGMA_INGEST_KEY");
  if (!apiKey) {
    console.error("DATAGMA_INGEST_KEY não encontrada no .env.local");
    process.exitCode = 1;
    return;
  }

  const lista = urls.map((item) => String(item).trim()).filter(Boolean);
  if (lista.length === 0) {
    console.error("Cole ao menos uma URL do LinkedIn na lista urls.");
    process.exitCode = 1;
    return;
  }

  let indice = 0;
  for (const url of lista) {
    indice += 1;
    if (indice > 1) await esperar(intervaloMs);

    const resposta = await fetch(urlDaRota, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ url }),
    });

    const texto = await resposta.text();
    let resultado;
    try {
      resultado = texto ? JSON.parse(texto) : { error: "Resposta vazia" };
    } catch {
      resultado = {
        error: "Resposta não é JSON",
        status: resposta.status,
        corpo: texto.slice(0, 200),
      };
    }
    console.log(`[${indice}/${lista.length}] ${url}`, resultado);
  }
};

importarPerfis();
