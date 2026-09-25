const dispararBusca = async () => {
  const urlDoSeuSite = "http://localhost:3000/api/integrations/datagma/bulk-import";

  const resposta = await fetch(urlDoSeuSite, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "vitrine123",
    },
    body: JSON.stringify({
      // A rota traduz keyword -> keywords e envia location
      // para POST /api/v1/people-search/search
      keyword: "Programador React",
      location: "Brazil",
    }),
  });

  const resultado = await resposta.json();
  console.log("Resultado da busca em lote:", resultado);
};

dispararBusca();
