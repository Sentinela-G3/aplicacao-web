
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
      return data.values;  // Agora estamos passando os tickets de dentro de 'values'
    } else {
      console.error('A resposta não contém tickets ou não é um array');
    }
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
  }
}

// Função para renderizar os tickets na lista
async function renderTickets() {
  const div = document.getElementById("box-linhas")
  const tickets = await fetchTickets()
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

    const status = ticket.currentStatus.status;
    var constVar;

    if (status == "Aberto" || status == "Reaberto") {
      constVar = "status-aberto"
    } else if (status == "Fechada") {
      constVar = "status-resolvido"
    } else if (status == "Em andamento") {
      constVar = "status-andamento"
    }


    if (ticket.requestTypeId == "5") {
      div.innerHTML += `<tr>
                          <td class="alerta-chave">${ticket.issueKey}</td>
                          <td>${descricaoTratada}</td>
                          <td class="alerta-dispositivo">${maquina[1]}</td>
                          <td class= 'alerta-horario'> ${textHoraAbertura}</td>
                          <td><span class="status-badge ${constVar}" >${ticket.currentStatus.status}</span></td>
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

async function listarMembrosDoProjeto() {
  try {
    const response = await fetch('http://localhost:3333/jira/membros');

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();


    console.log('Resposta da API:', data)
    if (data.values) {
      return data
    } else {
      console.error('A resposta não contém membros ou não é um array');
    }
  } catch (error) {
    console.error('Erro ao buscar membros1:', error);
  }
}

async function buscarResponsavel(chaveTicket) {
  try {
    const response = await fetch(`http://localhost:3333/jira/buscarResponsavel/${chaveTicket}`);

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Responsavel pelo ticket ${chaveTicket} é ${data}`)

    return data;
  } catch (error) {
    console.error('Erro ao buscar responsavel:', error);
  }
}

async function setarResponsavel(chaveTicket, idNovoResposnavel) {
  // Dados para criação de ticket
  const ticketData = {
    issueKey: chaveTicket,
    accountId: idNovoResposnavel
  };

  try {
    const response = await fetch('http://localhost:3333/jira/setar-responsavel', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });
  } catch (error) {
    console.error('Erro ao setar responsavel:', error);
  }
}

async function renderTicketsGilberto() {
  const listaMembros = await listarMembrosDoProjeto()
  const div = document.getElementById("lista-tickets")
  const tickets = await fetchTickets()
  var contar = 1;
  for (const ticket of tickets) {
    const date = new Date(ticket.createdDate.jira);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const textHoraAbertura = `${day}/${month} às ${hours}:${minutes}`

    const descricao = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value;
    const maquina = ticket.summary.split(" ");
    const descricaoSeparada = descricao.split('*');
    const descricaoTratada = descricaoSeparada[3].charAt(0).toUpperCase() + descricaoSeparada[3].slice(1);

    const status = ticket.currentStatus.status;

    const chaveTicket = ticket.issueKey;

    const recurso = ticket.requestFieldValues[2].value.value;

    const urgencia = ticket.requestFieldValues[3].value.value;

    var styleUrgencia;


    if (urgencia == "Crítico") {
      styleUrgencia = "critico"
    } else if (urgencia == "Grave") {
      styleUrgencia = "grave"
    } else if (urgencia == "Leve") {
      styleUrgencia = "leve"
    }

    if (ticket.requestTypeId == "5" && status == "Aberto" || status == "Reaberto") {
      contar++;
      var brancoOuCinza;
      if (contar % 2 == 0) {
        brancoOuCinza = 'par'
      } else if (contar % 2 == 1) {
        brancoOuCinza = 'impar'
      }
      div.innerHTML += `<div class="ticket-layout ${brancoOuCinza}">
                        <div class="box-urgencia ${styleUrgencia}">
                            <div class="div-urgencia ${styleUrgencia}">
                                <span id="text-urgencia">${urgencia.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="box-esquerda">
                            <span class="text-infos" id="id-dispositivo">ID Dispositivo: ${maquina[1]}</span>
                            <span class="text-infos" id="recurso">Recurso: <b>${recurso}</b></span>
                            <span class="text-infos" id="descricao">${descricaoTratada}</span>
                            <span class="text-infos" id="hrDeAbertura"><i>Aberto em ${textHoraAbertura}</i></span>
                        </div>
                        <div class="box-direita">
                            <span class="text-infos" id="prazoSLA">Prazo para cumprimento da SLA <br> <b
                                    style="color: red;">20 min e 30 seg</b> </span>
                            <div class="box-buttons">
                                <button class="buttons-tickets btn" id="button-detalhes">Ver Detalhes</button>
                                <select class="buttons-tickets select" id="selection-responsavel${chaveTicket}">
                                    <option value="" >Responsável</option>
                                </select>
                                <button class="buttons-tickets btn" id="btn-designar" onclick="setarResponsavel('${chaveTicket}', document.getElementById('selection-responsavel${chaveTicket}').value)">Designar</button>
                            </div>
                        </div>
                    </div>`;

      const select = document.getElementById(`selection-responsavel${chaveTicket}`)

      var responsavelTicket = await buscarResponsavel(chaveTicket)

      for (let index = 0; index < listaMembros.length; index++) {
        var element = listaMembros[index];
        displayName = element?.displayName;
        AccountId = element?.accountId

        if (displayName == responsavelTicket) {
          select.innerHTML += `<option value="${AccountId}" selected>${responsavelTicket}</option>`
        } else {
          select.innerHTML += `<option value="${AccountId}">${displayName}</option>`
        }

      }
    }
  };

  alertasPorComponente(tickets)
}

function alertasPorComponente(tickets) {
  const divQtd = document.getElementById("subtitulo-grafico")
  var contarTempo = 0;
  var contarRede = 0;
  var contarCPU = 0;
  var contarMemoria = 0;
  var contarDisco = 0;
  var contarBateria = 0;
  var contarQtd = 0;

  tickets.forEach(ticket => {
    const status = ticket.currentStatus.status;

    if (ticket.requestTypeId == "5" && status == "Aberto" || status == "Reaberto") {
      const recurso = ticket.requestFieldValues[2].value.value;
      contarQtd++;
      if (recurso == "Tempo de Uso") {
        contarTempo++;
      } else if (recurso == "Rede") {
        contarRede++;
      } else if (recurso == "CPU") {
        contarCPU++;
      } else if (recurso == "Memória") {
        contarMemoria++;
      } else if (recurso == "Disco") {
        contarDisco++;
      } else if (recurso == "Bateria") {
        contarBateria++;
      }
    }
  })

  var listaQtdComponentes = [contarTempo, contarRede, contarCPU, contarMemoria, contarDisco, contarBateria]


  divQtd.innerHTML = `<i>Quantidade:</i> <b> ${contarQtd}</b> `

  var graficoRosca = {
    chart: {
      type: 'donut',
      height: '80%',
      width: '100%',
    },
    series: listaQtdComponentes,
    labels: ['Tempo', 'Rede', 'CPU', 'Memória', 'Disco', 'Bateria'],
    plotOptions: {
      pie: {
        donut: {
          size: '50%'
        }
      }
    },
    dataLabels: {
      dropShadow: {
        enabled: false
      },
      style: {
        colors: ['#000'],
        fontSize: '14px',
      }
    },
    legend: {
      position: 'right',
      horizontalAlign: 'center',
      offsetY: -10,
      offsetX: 30,
      labels: {
        colors: ['#000'], // cor do texto da legenda
        useSeriesColors: false,
        fontSize: '20px', // aumenta o tamanho da legenda
        fontWeight: 700    // 700 = negrito
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  var graficoRoscaTela = new ApexCharts(document.querySelector("#graficoRosca"), graficoRosca);
  graficoRoscaTela.render();
  recorrenciaDeAlertas(tickets)
}


function recorrenciaDeAlertas(tickets) {
  let jsonRecorrencia = []

  tickets.forEach(ticket => {
    const descricao = ticket.requestFieldValues?.find(f => f.fieldId == "description")?.value;
    const descricaoSeparada = descricao.split('*');
    const descricaoTratada = descricaoSeparada[3].charAt(0).toUpperCase() + descricaoSeparada[3].slice(1);

    const itemExistente = jsonRecorrencia.find(item => item.tipo === descricaoTratada);

    if (itemExistente) {
      // Se ja existe adiciona mais um
      itemExistente.quantidade += 1;
    } else {
      //  Se não existe, adiciona um novo
      jsonRecorrencia.push({ tipo: descricaoTratada, quantidade: 1 });
    }

  })

  for (let index = 0; index < jsonRecorrencia.length - 1; index++) {
    let minIdex = index;

    for (let index2 = index + 1; index2 < jsonRecorrencia.length; index2++) {
      if (jsonRecorrencia[index2].quantidade > jsonRecorrencia[minIdex].quantidade) {
        minIdex = index2;
      }
    }

    if (minIdex != index) {
      let temporario = jsonRecorrencia[index];
      jsonRecorrencia[index] = jsonRecorrencia[minIdex];
      jsonRecorrencia[minIdex] = temporario;
    }
  }
  console.log(jsonRecorrencia)

  aliceDiv = document.getElementById('alice')

  aliceDiv.innerHTML = `<tr class="tr-posicoes">
                        <td class="text-posicao">1º</td>
                        <td class="text-tipo">${jsonRecorrencia[0].tipo}</td>
                        <td class="text-qtd">${jsonRecorrencia[0].quantidade}</td>
                    </tr>
                    <tr class="tr-posicoes">
                        <td class="text-posicao">2º</td>
                        <td class="text-tipo">${jsonRecorrencia[1].tipo}</td>
                        <td class="text-qtd">${jsonRecorrencia[1].quantidade}</td>
                    </tr>
                    <tr class="tr-posicoes">
                        <td class="text-posicao">3º</td>
                        <td class="text-tipo">${jsonRecorrencia[2].tipo}</td>
                        <td class="text-qtd">${jsonRecorrencia[2].quantidade}</td>
                    </tr>
                    <tr class="tr-posicoes">
                        <td class="text-posicao">4º</td>
                        <td class="text-tipo">${jsonRecorrencia[3].tipo}</td>
                        <td class="text-qtd">${jsonRecorrencia[3].quantidade}</td>
                    </tr>
                    <tr class="tr-posicoes">
                        <td class="text-posicao">5º</td>
                        <td class="text-tipo">${jsonRecorrencia[4].tipo}</td>
                        <td class="text-qtd">${jsonRecorrencia[4].quantidade}</td>
                    </tr>`

}



//Função para filtar alertas de acordo com status e periodo
function filtrarAlertas() {
  const statusSelecionado = document.getElementById('select-status').value.toLowerCase();
  const dataInicioInput = document.getElementById('periodoInicio').value;
  const dataFimInput = document.getElementById('periodoFim').value;

  const dataInicio = dataInicioInput ? new Date(`${dataInicioInput}T00:00:00`) : null;
  const dataFim = dataFimInput ? new Date(`${dataFimInput}T23:59:59`) : null;

  const linhas = document.querySelectorAll('#lista-alertas tbody tr');

  linhas.forEach(linha => {
    const status = linha.querySelector('.status-resolvido').textContent.toLowerCase();
    const dataTexto = linha.querySelector('.alerta-horario').textContent;

    const [dataParte, horaParte] = dataTexto.split(' às ');
    const [dia, mes, ano] = dataParte.split('/');
    const [hora, minuto] = horaParte.split(':');

    const dataChamado = new Date(ano, mes - 1, dia, hora, minuto);

    let exibir = true;

    if (statusSelecionado !== 'todos' && status !== statusSelecionado) {
      exibir = false;
    }

    if (dataInicio && dataChamado < dataInicio) {
      exibir = false;
    }

    if (dataFim && dataChamado > dataFim) {
      exibir = false;
    }

    linha.style.display = exibir ? '' : 'none';
  });
}

function pesquisarChaveOuId() {
  const termo = document.getElementById('inputBusca').value.toLowerCase();
  const linhas = document.querySelectorAll('#lista-alertas tbody tr');

  linhas.forEach(linha => {
    const chave = linha.querySelector('.alerta-chave').textContent.toLowerCase();
    const idDispositivo = linha.querySelector('.alerta-dispositivo').textContent.toLowerCase();

    if (chave.includes(termo) || idDispositivo.includes(termo)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

function analiseDetalhada(idMaquina) {
  window.location = `./dash_analiseDetalhada.html?id=${idMaquina}`;
}