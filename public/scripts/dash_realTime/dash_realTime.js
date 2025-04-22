// Verificando sessão do usuário
if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
    alert("Sua sessão expirou! Logue-se novamente.");
    window.location.href = "../login.html";
}

const usuario = {
    idEmpresa: sessionStorage.idEmpresa,
    idUsuario: sessionStorage.idUsuario,
    email: sessionStorage.email,
    tipoUsuario: sessionStorage.tipoUsuario,
    nomeUsuario: sessionStorage.nomeUsuario
};

// Plotando nome no menu lateral
const b_nome_usuario = document.getElementById("nome_usuario");
b_nome_usuario.innerHTML = usuario.nomeUsuario;

 // Função para buscar dados da máquina e preencher a tabela
 async function carregarMaquinas() {
    try {
        // 1. Busca todas as máquinas da empresa
        const response = await fetch(`http://localhost:3333/maquinas/${sessionStorage.getItem('idEmpresa')}`);
        if (!response.ok) throw new Error('Erro ao buscar máquinas');
        const machines = await response.json();

        // 2. Limpa e prepara a tabela
        const tableBody = document.querySelector('.table_body');
        tableBody.innerHTML = '';

        // 3. Processa cada máquina
        for (const machine of machines) {
            // Busca as métricas da máquina
            const metricsResponse = await fetch(`http://localhost:3333/medidas/${machine.id_maquina}/componentes`);
            let metrics = [];
            if (metricsResponse.ok) {
                metrics = await metricsResponse.json();
            }

            // 4. Determina o status com base na última captura
            let statusText, statusColor;
            let ultimaCapturaFormatted = '-';
            
            if (metrics.length > 0) {
                // Pega o timestamp da primeira métrica (já ordenada pela API)
                const ultimaCaptura = new Date(metrics[0].timestamp_captura);
                const agora = new Date();
                const diferencaSegundos = (agora - ultimaCaptura) / 1000;
                const isAtivo = diferencaSegundos <= 10;

                ultimaCapturaFormatted = metrics[0].data_hora_captura;

                if (isAtivo) {
                    statusColor = 'green';
                    statusText = 'Ativo';
                } else {
                    statusColor = 'red';
                    statusText = `Inativo (${ultimaCapturaFormatted})`;
                }
            } else {
                statusColor = 'gray';
                statusText = 'Sem dados';
            }

            // 5. Obtém os valores das métricas específicas
            const getMetricValue = (type) => {
                const metric = metrics.find(m => m.tipo === type);
                return metric ? {
                    value: metric.valor,
                    min: metric.minimo,
                    max: metric.maximo,
                    data_captura: metric.data_hora_captura
                } : null;
            };

            const uptime = getMetricValue('uptime_hours');
            const ram = getMetricValue('ram_percent');
            const cpu = getMetricValue('cpu_percent');
            const disk = getMetricValue('disk_percent');

            // 6. Formatadores
            const formatTime = (hours) => {
                if (!hours || hours.value === undefined) return '-';
                const h = Math.floor(hours.value);
                const m = Math.floor((hours.value % 1) * 60);
                return `${h}:${m.toString().padStart(2, '0')}`;
            };

            const formatPercent = (metric) => {
                if (!metric || metric.value === undefined) return '-';
                return `${metric.value.toFixed(0)}`;
            };

            // 7. Cria a linha da tabela
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                <td style="color: ${statusColor}">${statusText}</td>
                <td>${formatTime(uptime)}</td>
                <td>0</td>
                <td>Nenhum</td>
                <td>${formatPercent(ram)}</td>
                <td>${formatPercent(cpu)}</td>
                <td>${formatPercent(disk)}</td>
                <td><button class="details-btn" data-id="${machine.id_maquina}">Expandir Análise</button></td>
            `;

            tableBody.appendChild(row);
        }

    } catch (error) {
        console.error('Erro ao carregar máquinas:', error);
        showErrorNotification('Falha ao carregar dados das máquinas');
    }
}


async function carregarAlertas() {
    try {
        const response = await fetch('http://localhost:3333/jira/tickets');
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.statusText}`);
        }
    
        const data = await response.json();
    // Verifique o formato dos dados retornados
    console.log('Resposta da API:', data.values);
    const qtdAlertas = data.values.length;

    const span_qtd_alertas = document.getElementById('qtd_alertas');
    span_qtd_alertas.innerHTML = qtdAlertas;
      
    // A resposta contém os tickets dentro de data.values
    if (data.values) {
      // renderTickets(data.values);  // Agora estamos passando os tickets de dentro de 'values'
    } else {
      console.error('A resposta não contém tickets ou não é um array');
    }
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
  }
}

// Chamando a função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarMaquinas);
document.addEventListener('DOMContentLoaded', carregarAlertas)

setInterval(carregarMaquinas, 5000);

