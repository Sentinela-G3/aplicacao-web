
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('tickets');
const apiBaseUrl = window.location.origin;

async function fetchTickets() {
  try {
    const response = await fetch('http://localhost:3333/jira/tickets');

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();

    // Agora data é um array diretamente
    console.log('Primeiro ticket:', data[0]);

    if (Array.isArray(data)) {
      return data;
    } else {
      console.error('A resposta da API não é um array de tickets');
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return [];
  }
}

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

    return data;
  } catch (error) {
    console.error('Erro ao buscar responsavel:', error);
  }
}

async function setarResponsavel(chaveTicket, idNovoResposnavel) {
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

async function renderTicketsGilberto(tickets) {
  const listaMembros = await listarMembrosDoProjeto();
  const container = document.getElementById("tickets-container");
  container.innerHTML = "";

  const prioridadeUrgencia = {
    "Crítico": 3,
    "Grave": 2,
    "Leve": 1
  };

  // Ordenar tickets
  tickets.sort((a, b) => {
    const urgenciaA = a.requestFieldValues?.find(f => f.fieldId === "customfield_urgencia")?.value?.value || a.requestFieldValues[3]?.value?.value || "";
    const urgenciaB = b.requestFieldValues?.find(f => f.fieldId === "customfield_urgencia")?.value?.value || b.requestFieldValues[3]?.value?.value || "";

    const prioridadeA = prioridadeUrgencia[urgenciaA] || 0;
    const prioridadeB = prioridadeUrgencia[urgenciaB] || 0;

    if (prioridadeB !== prioridadeA) return prioridadeB - prioridadeA;

    const dataA = new Date(a.createdDate.jira);
    const dataB = new Date(b.createdDate.jira);
    return dataA - dataB;
  });

  const ticketsParaRenderizar = tickets.filter(t => t.requestTypeId == "5" && (t.currentStatus.status == "Aberto" || t.currentStatus.status == "Reaberto"));

  const responsaveisPromises = ticketsParaRenderizar.map(t => buscarResponsavel(t.issueKey));
  const responsaveis = await Promise.all(responsaveisPromises);

  let contar = 0;
  ticketsParaRenderizar.forEach((ticket, index) => {
    contar++;
    const responsavelTicket = responsaveis[index];

    const horaDoTicket = ticket.requestFieldValues[4];
    const horaAberturaStr = horaDoTicket.value || horaDoTicket.renderedValue;
    const date = new Date(horaAberturaStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const textHoraAbertura = `${day}/${month} às ${hours}:${minutes}`;

    const descricao = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value;
    const maquina = ticket.summary.split(" ");
    const status = ticket.currentStatus.status;
    const chaveTicket = ticket.issueKey;
    const recurso = ticket.requestFieldValues[2].value.value;
    const urgencia = ticket.requestFieldValues[3].value.value;

    let styleUrgencia = "";
    if (urgencia === "Crítico") styleUrgencia = "critico";
    else if (urgencia === "Grave") styleUrgencia = "grave";
    else if (urgencia === "Leve") styleUrgencia = "leve";

    const brancoOuCinza = (contar % 2 === 0) ? "par" : "impar";

    // Cálculo da SLA
    let prazoSlaHoras = 0;
    if (urgencia === "Crítico") prazoSlaHoras = 6;
    else if (urgencia === "Grave") prazoSlaHoras = 12;
    else if (urgencia === "Leve") prazoSlaHoras = 24;

    const dataAbertura = new Date(horaAberturaStr);
    const dataLimite = new Date(dataAbertura.getTime() + prazoSlaHoras * 60 * 60 * 1000);
    const agora = new Date();
    const tempoRestanteMs = dataLimite - agora;

    let textoSLA = "";
    const horas = Math.floor(Math.abs(tempoRestanteMs) / (1000 * 60 * 60));
    const minutos = Math.floor((Math.abs(tempoRestanteMs) % (1000 * 60 * 60)) / (1000 * 60));

    if (tempoRestanteMs > 0) {
      textoSLA = `<b style="color: orange;">${horas}h ${minutos}min restantes</b>`;
    } else {
      textoSLA = `<b style="color: red;">- ${horas}h ${minutos}min</b>`;
    }

    container.innerHTML += `<div class="ticket-layout ${brancoOuCinza}">
      <div class="box-urgencia ${styleUrgencia}">
          <div class="div-urgencia ${styleUrgencia}">
              <span id="text-urgencia">${urgencia.toUpperCase()}</span>
          </div>
      </div>
      <div class="box-esquerda">
          <span class="text-infos" id="id-dispositivo">ID Dispositivo: ${maquina[1]}</span>
          <span class="text-infos" id="recurso">Recurso: <b>${recurso}</b></span>
          <span class="text-infos" id="descricao">${descricao}</span>
          <span class="text-infos" id="hrDeAbertura"><i>Aberto em ${textHoraAbertura}</i></span>
      </div>
      <div class="box-direita">
          <span class="text-infos" id="prazoSLA">Prazo para cumprimento da SLA <br> ${textoSLA}</span>
          <div class="box-buttons">
              <button class="buttons-tickets btn" id="button-detalhes" onclick="redirecionar(${maquina[1]})">Ver Detalhes</button>
              <select class="buttons-tickets select" id="selection-responsavel${chaveTicket}">
                  <option value="">Responsável</option>
                  ${listaMembros.map(membro => {
                    const selected = membro.displayName === responsavelTicket ? "selected" : "";
                    return `<option value="${membro.accountId}" ${selected}>${membro.displayName}</option>`;
                  }).join('')}
              </select>
              <button class="buttons-tickets btn" id="btn-designar" onclick="setarResponsavel('${chaveTicket}', document.getElementById('selection-responsavel${chaveTicket}').value)">Designar</button>
          </div>
      </div>
    </div>`;
  });

  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.remove();
  container.style.display = "flex";
}

async function alertasPorComponente() {
  const tickets = await fetchTickets()
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

  var listaQtdComponentes = [ contarCPU, contarMemoria, contarDisco, contarRede, contarBateria, contarTempo]

  divQtd.innerHTML = `<i>Quantidade:</i> <b> ${contarQtd}</b> `

  var graficoRosca = {
    chart: {
      type: 'donut',
      height: '80%',
      width: '100%',
    },
    series: listaQtdComponentes,
    labels: ['CPU', 'Memória','Disco', 'Rede', 'Bateria', 'Tempo de Uso'],
    colors: ['#FFA500', '#20C997', '#1E90FF', '#FFD700', '#FF6F61', '#8Bff13'],
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
        colors: ['#000'],
        useSeriesColors: false,
        fontSize: '20px',
        fontWeight: 700
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
  const descricoesBase = [
    "aumento crítico de cpu",
    "uso de cpu grave",
    "leve aumento no uso de cpu",
    "aumento crítico de ram",
    "aumento grave de ram",
    "leve aumento no uso da ram",
    "uso de disco",
    "aumento crítico no uso do link",
    "aumento grave no uso do link",
    "leve aumento no uso do link",
    "nível de bateria",
    "velocidade de upload",
    "operando por"
  ];

  const recorrencia = [];

  tickets.forEach(ticket => {
    const descricao = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value?.toLowerCase();
    if (!descricao) return;

    for (const base of descricoesBase) {
      if (descricao.includes(base)) {
        const itemExistente = recorrencia.find(item => item.tipo === base);
        if (itemExistente) {
          itemExistente.quantidade += 1;
        } else {
          recorrencia.push({ tipo: base, quantidade: 1 });
        }
        break; // considera só a primeira correspondência
      }
    }
  });

  recorrencia.sort((a, b) => b.quantidade - a.quantidade);

  const aliceDiv = document.getElementById('alice');
  let html = '';

  var corReccorencia;
  for (let i = 0; i < Math.min(5, recorrencia.length); i++) {
    if(recorrencia[i].quantidade >= 30){
      corReccorencia = "vermelhao"
    } else if(recorrencia[i].quantidade >= 15){
      corReccorencia = "vermelho"
    } else{
      corReccorencia = "branco"
    }

    text = recorrencia[i].tipo.trim().toLowerCase();
    text = text.charAt(0).toUpperCase() + text.slice(1);

    html += `<tr class="tr-posicoes ${corReccorencia}">
                <td class="text-posicao">${i + 1}º</td>
                <td class="text-tipo"><b>${text}</b></td>
                <td class="text-qtd">${recorrencia[i].quantidade}</td>
              </tr>`;
  }

  aliceDiv.innerHTML = html;

  graficoQtdHora(tickets);
}

function graficoQtdHora(tickets) {
  const agora = new Date();

  function horaMenos(n) {
    const novaData = new Date(agora);
    novaData.setHours(agora.getHours() - n);

    return novaData.getHours();
  }

  const horaAtual = agora.getHours();
  const horaMenos1 = horaMenos(1);
  const horaMenos2 = horaMenos(2);
  const horaMenos3 = horaMenos(3);
  const horaMenos4 = horaMenos(4);
  const horaMenos5 = horaMenos(5);

  const horas = [horaMenos5, horaMenos4, horaMenos3, horaMenos2, horaMenos1, horaAtual]

  var horaAtualCPU = 0;
  var horaMenos1CPU = 0;
  var horaMenos2CPU = 0;
  var horaMenos3CPU = 0;
  var horaMenos4CPU = 0;
  var horaMenos5CPU = 0;

  var horaAtualMemoria = 0;
  var horaMenos1Memoria = 0;
  var horaMenos2Memoria = 0;
  var horaMenos3Memoria = 0;
  var horaMenos4Memoria = 0;
  var horaMenos5Memoria = 0;

  var horaAtualDisco = 0;
  var horaMenos1Disco = 0;
  var horaMenos2Disco = 0;
  var horaMenos3Disco = 0;
  var horaMenos4Disco = 0;
  var horaMenos5Disco = 0;

  var horaAtualRede = 0;
  var horaMenos1Rede = 0;
  var horaMenos2Rede = 0;
  var horaMenos3Rede = 0;
  var horaMenos4Rede = 0;
  var horaMenos5Rede = 0;

  var horaAtualBateria = 0;
  var horaMenos1Bateria = 0;
  var horaMenos2Bateria = 0;
  var horaMenos3Bateria = 0;
  var horaMenos4Bateria = 0;
  var horaMenos5Bateria = 0;

  var horaAtualTempo = 0;
  var horaMenos1Tempo = 0;
  var horaMenos2Tempo = 0;
  var horaMenos3Tempo = 0;
  var horaMenos4Tempo = 0;
  var horaMenos5Tempo = 0;

  for (const ticket of tickets) {
    const recurso = ticket.requestFieldValues[2].value.value;

    const horaDoTicket = ticket.requestFieldValues[4];
    const horaAberturaStr = horaDoTicket.value || horaDoTicket.renderedValue;
    const dataHora = new Date(horaAberturaStr);
    var horaTicket = dataHora.getHours();
    if (recurso == "CPU") {
      if (horaTicket == horaAtual) {
        horaAtualCPU++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1CPU++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2CPU++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3CPU++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4CPU++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5CPU++;
      }
    } else if (recurso == "Memória") {
      if (horaTicket == horaAtual) {
        horaAtualMemoria++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1Memoria++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2Memoria++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3Memoria++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4Memoria++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5Memoria++;
      }
    } else if (recurso == "Disco") {
      if (horaTicket == horaAtual) {
        horaAtualDisco++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1Disco++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2Disco++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3Disco++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4Disco++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5Disco++;
      }
    } else if (recurso == "Rede") {
      if (horaTicket == horaAtual) {
        horaAtualRede++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1Rede++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2Rede++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3Rede++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4Rede++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5Rede++;
      }
    } else if (recurso == "Bateria") {
      if (horaTicket == horaAtual) {
        horaAtualBateria++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1Bateria++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2Bateria++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3Bateria++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4Bateria++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5Bateria++;
      }
    } else if (recurso == "Tempo de Uso") {
      if (horaTicket == horaAtual) {
        horaAtualTempo++;
      } else if (horaTicket == horaMenos1) {
        horaMenos1Tempo++;
      } else if (horaTicket == horaMenos2) {
        horaMenos2Tempo++;
      } else if (horaTicket == horaMenos3) {
        horaMenos3Tempo++;
      } else if (horaTicket == horaMenos4) {
        horaMenos4Tempo++;
      } else if (horaTicket == horaMenos5) {
        horaMenos5Tempo++;
      }
    }
  }

  const cpu = [horaMenos5CPU, horaMenos4CPU, horaMenos3CPU, horaMenos2CPU, horaMenos1CPU, horaAtualCPU]
  const memoria = [horaMenos5Memoria, horaMenos4Memoria, horaMenos3Memoria, horaMenos2Memoria, horaMenos1Memoria, horaAtualMemoria]
  const disco = [horaMenos5Disco, horaMenos4Disco, horaMenos3Disco, horaMenos2Disco, horaMenos1Disco, horaAtualDisco]
  const bateria = [horaMenos5Bateria, horaMenos4Bateria, horaMenos3Bateria, horaMenos2Bateria, horaMenos1Bateria, horaAtualBateria]
  const rede = [horaMenos5Rede, horaMenos4Rede, horaMenos3Rede, horaMenos2Rede, horaMenos1Rede, horaAtualRede]
  const tempo = [horaMenos5Tempo, horaMenos4Tempo, horaMenos3Tempo, horaMenos2Tempo, horaMenos1Tempo, horaAtualTempo]

  var timelineAlertas = {
    grid: {
      padding: {
        top: -20,
        right: -10,
        bottom: -20,
      }
    },
    chart: {
      type: 'bar',
      height: '100%',
      width: '100%',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#000']
      },
      dropShadow: {
        enabled: false
      }
    },
    series: [
      {
        name: 'CPU',
        data: cpu
      },
      {
        name: 'Memória',
        data: memoria
      },
      {
        name: 'Disco',
        data: disco
      },
      {
        name: 'Rede',
        data: rede
      },
      {
        name: 'Bateria',
        data: bateria
      },
      {
        name: 'Tempo de Uso',
        data: tempo
      }
    ],
    xaxis: {
      categories: horas,
      title: {
        text: 'Hora',
        offsetY: -10,
        style: {
          fontWeight: 'bold'
        }
      },
      offsetY: -10
    },
    yaxis: {
      title: {
        text: 'Quantidade'
      },
      min: 0,
      max: 16
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '80%',
        endingShape: 'flat'
      }
    },
    colors: ['#FFA500', '#20C997', '#1E90FF', '#FFD700', '#FF6F61', '#8Bff13'],
    legend: {
      position: 'top',
    }
  };

  var timelineAlertasTela = new ApexCharts(document.querySelector("#timelineAlertas"), timelineAlertas);
  timelineAlertasTela.render();
  renderTicketsGilberto(tickets)
};

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

function redirecionar(serialNumber) {
  fetch('/maquinas/obterFkModelo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ serialNumber: serialNumber })
  })
    .then(response => response.json())
    .then(data => {
      const idMaquina = data.idMaquina; // assumindo que o backend retorna { idMaquina: ... }
      if (idMaquina) {
        window.location = `./dash_analiseDetalhada.html?id=${idMaquina}`;
      } else {
        console.error('ID da máquina não encontrado na resposta');
      }
    })
    .catch(error => console.error('Erro:', error));
}