function modelosMaquina() {
  fetch("/maquinas/obterModelosMaquina", {
    method: 'GET'
  })
  .then((res) => res.json())
  .then((json) => {
    console.log(json)
    let modeloMaquina; 
  })
}

function dadosModeloComponente(modelo) {
  fetch(`/maquinas/buscarModeloComponente/${modelo}`, {
    method: 'GET'
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(json)

      if (resposta.ok) {
        return resposta.json()
      } else {
        throw new Error("Erro na requisição")
      }
    })
    .then((json) => {
      if (json.length > 0) {
        let dados = json[0]
        comp_CPU.innerHTML = dados.modelo_cpu
        comp_RAM.innerHTML = dados.modelo_ram
        comp_Rede.innerHTML = dados.modelo_placaRede
        comp_Bateria.innerHTML = dados.modelo_bateria
        comp_Disco.innerHTML = dados.modelo_disco
      } else {
        console.warn("Nenhum dado encontrado para o modelo informado.")
      }
    })
    .catch((erro) => console.error("Erro ao buscar dados do modelo:", erro))
}