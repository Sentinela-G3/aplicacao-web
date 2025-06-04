document.addEventListener('DOMContentLoaded', () => {
      const ticketForm = document.getElementById('ticketForm');
    const ticketsList = document.getElementById('tickets');
    const apiBaseUrl = window.location.origin;
    // Função para buscar os tickets
    async function fetchTickets() {
        try {
          const response = await fetch('http://localhost:3333/jira/tickets');
          
          if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
          }
      
          const data = await response.json();
          
          // Verifique o formato dos dados retornados
          console.log('Resposta da API:', data.values[0]);
      
          // A resposta contém os tickets dentro de data.values
          if (data.values) {
            renderTickets(data.values);  // Agora estamos passando os tickets de dentro de 'values'
          } else {
            console.error('A resposta não contém tickets ou não é um array');
          }
        } catch (error) {
          console.error('Erro ao buscar tickets:', error);
        }
      }
  
    // Função para renderizar os tickets na lista
    function renderTickets(tickets) {
      const div = document.getElementById("box-linhas")
      tickets.forEach(ticket => {
        console.log(ticket)
        const date = new Date(ticket.createdDate.jira);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const textHoraAbertura = `${day}/${month}/${year} às ${hours}:${minutes}`

        const descricao = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value;
        const maquina = ticket.summary.split(" ");
        const descricaoSeparada = descricao.split('*');

        const descricaoTratada = descricaoSeparada[3].charAt(0).toUpperCase() + descricaoSeparada[3].slice(1);


        if( ticket.requestTypeId == "5"){
          div.innerHTML += `<tr>
                          <td class="alerta-chave">${ticket.issueKey}</td>
                          <td>${descricaoTratada}</td>
                          <td class="alerta-dispositivo">${maquina[1]}</td>
                          <td class= 'alerta-horario'> ${textHoraAbertura}</td>
                          <td><span class="status-badge status-resolvido" >${ticket.currentStatus.status}</span></td>
                      </tr>`;
        }
      });

    }

    // Função para criar um novo ticket
    async function createTicket(event) {
        event.preventDefault();
      
        const summary = document.getElementById('summary').value;
        const description = document.getElementById('description').value;
        const priority = document.getElementById('priority').value;
      
        // Dados para criação de ticket
        const ticketData = {
            summary: summary,
            description: description,
            priority: priority
          };
      
        try {
          const response = await fetch('http://localhost:3333/jira/create-ticket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData),
          });
      
          if (response.ok) {
            alert('Ticket criado com sucesso!');
            fetchTickets(); // Atualiza a lista de tickets
            ticketForm.reset();
          } else {
            const errorData = await response.json();
            console.error('Erro ao criar ticket:', errorData);
            alert('Erro ao criar o ticket: ' + (errorData.details || 'Desconhecido'));
          }
        } catch (error) {
          console.error('Erro ao criar ticket:', error);
          alert('Erro ao criar o ticket');
        }
      }
  
    // Evento de submit do formulário
    // ticketForm.addEventListener('submit', createTicket);
  
    // Carrega os tickets ao carregar a página
    fetchTickets(); 
})
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