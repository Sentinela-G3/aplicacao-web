window.onload = modelosMaquina(sessionStorage.idEmpresa);

let selectSlt = document.getElementById("slt_modelo")
let modelo = Number(selectSlt.value)

selectSlt.addEventListener("change", () => {
  modelo = Number(selectSlt.value);
  dadosModeloComponente(modelo)
});

window.addEventListener("load", dadosModeloComponente(modelo))

function modelosMaquina(idEmpresa) {
  fetch(`/maquinas/obterModelosMaquina/${idEmpresa}`, {
    method: 'GET'
  })
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error("Erro na requisição")
      }
    })
    .then((json) => {
      console.log(json)
      if (json.length > 0) {
        let primeiro = true
        json.forEach(item => {
          let idModeloMaquina = item["id_modelo"];
          let modeloMaquina = item["nome"];

          if (primeiro) {
            primeiro = false
            let option = document.createElement("option")
            option.selected
            option.value = idModeloMaquina
            option.textContent = modeloMaquina
            select.appendChild(option)
          } else {
            let option = document.createElement("option")
            option.value = idModeloMaquina
            option.textContent = modeloMaquina
            select.appendChild(option)
          }
        })
      }
    })
}

function dadosModeloComponente(modelo) {
  fetch(`/maquinas/dadosModeloComponente/${modelo}`, {
    method: 'GET'
  })
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error("Erro na requisição")
      }
    })
    .then((json) => {
      console.log(json)
      const esp_CPU = document.getElementById("met-esp_CPU")
      const esp_RAM = document.getElementById("met-esp_RAM")
      const esp_Rede = document.getElementById("met-esp_Rede")
      const esp_Bateria = document.getElementById("met-esp_Bateria")
      const esp_Disco = document.getElementById("met-esp_Disco")
      const esp_max_CPU = document.getElementById("met-esp-max_CPU")
      const esp_max_RAM = document.getElementById("met-esp-max_RAM")
      const esp_max_Rede = document.getElementById("met-esp-max_Rede")
      const esp_max_Bateria = document.getElementById("met-esp-max_Bateria")
      const esp_max_Disco = document.getElementById("met-esp-max_Disco")

      const modelo_CPU = document.getElementById("comp_CPU")
      const modelo_RAM = document.getElementById("comp_RAM")
      const modelo_Rede = document.getElementById("comp_Rede")
      const modelo_Bateria = document.getElementById("comp_Bateria")
      const modelo_Disco = document.getElementById("comp_Disco")
      if (json.length > 0) {
        let dados = json[0]
        esp_CPU.innerHTML = dados.usoComumCpu
        esp_RAM.innerHTML = dados.usoComumRam
        esp_Rede.innerHTML = dados.usoComumRede
        esp_Bateria.innerHTML = dados.usoComumBateria
        esp_Disco.innerHTML = dados.usoComumDisco
        esp_max_CPU.innerHTML = dados.usoMaximoCpu
        esp_max_RAM.innerHTML = dados.usoMaximoRam
        esp_max_Rede.innerHTML = dados.usoMaximoRede
        esp_max_Bateria.innerHTML = dados.usoMaximoBateria
        esp_max_Disco.innerHTML = dados.usoMaximoDisco

        modelo_CPU.innerHTML = dados.modelo_cpu
        modelo_RAM.innerHTML = dados.modelo_ram
        modelo_Rede.innerHTML = dados.modelo_placaRede
        modelo_Bateria.innerHTML = dados.modelo_bateria
        modelo_Disco.innerHTML = dados.modelo_disco
      } else {
        console.warn("Nenhum dado encontrado para o modelo informado.")
      }
    })
    .catch((erro) => console.error("Erro ao buscar dados do modelo:", erro))
}