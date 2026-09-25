const dispararTeste = async () => {
  // ATENÇÃO: Se o seu site estiver rodando em outra porta (ex: 3000), mude aqui embaixo
  const urlDoSeuSite = "http://localhost:3000/api/integrations/datamagnet/profile"; 
  
  const resposta = await fetch(urlDoSeuSite, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "vitrine123"
    },
    body: JSON.stringify({
      "url": "https://www.linkedin.com/in/erasmo-s-b659a3170/"
    })
  });

  const resultado = await resposta.json();
  console.log("Resultado do teste:", resultado);
};

dispararTeste();