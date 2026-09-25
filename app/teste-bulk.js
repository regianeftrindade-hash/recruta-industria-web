const fs = require("fs");
const path = require("path");

const urlDaRota = "https://recrutaindustria.com/api/integrations/datagma/bulk-import";

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

const dispararBusca = async () => {
  const apiKey = lerEnvLocal("DATAGMA_INGEST_KEY");
  if (!apiKey) {
    console.error("DATAGMA_INGEST_KEY não encontrada no .env.local");
    process.exitCode = 1;
    return;
  }

  const resposta = await fetch(urlDaRota, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      keyword: "Programador React",
      location: "Brazil",
      limit: 3,
    }),
  });

  const resultado = await resposta.json();
  console.log("Resultado da busca em lote:", resultado);
};

dispararBusca();
