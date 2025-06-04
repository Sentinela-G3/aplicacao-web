const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

const BASE_URL = window.location.hostname === "localhost"
    ? "localhost:3333"
    : "18.208.5.45:3333";

let chartCPU, chartMemoria, chartRede, chartDisco, chartDownload;
let intervaloAtualizacao;
let thresholdData = [];
let estadoOrdenacao = {
    campo: null,
    crescente: true
};

// Adicionando evento de click nos headers da tabela
document.getElementById('th-pid').addEventListener('click', () => ordenarPor('pid'));
document.getElementById('th-nome').addEventListener('click', () => ordenarPor('nome'));
document.getElementById('th-cpu').addEventListener('click', () => ordenarPor('cpu_percent'));
document.getElementById('th-ram').addEventListener('click', () => ordenarPor('memory_percent'));

document.getElementById("th-chave").addEventListener("click", () => ordenarTabelaAlertasPor("issueKey"));
document.getElementById("th-desc").addEventListener("click", () => ordenarTabelaAlertasPor("descricaoTratada"));
document.getElementById("th-disp").addEventListener("click", () => ordenarTabelaAlertasPor("idDispositivo"));
document.getElementById("th-data").addEventListener("click", () => ordenarTabelaAlertasPor("textHoraAbertura"));


// Ordenação de alertas
let alertasAtuais = [];
let estadoOrdenacaoAlertas = {
    campo: null,
    crescente: true
};



// Funções auxiliares para cálculos e conversões

async function obterSerialPorId(id) {
    try {
        const response = await fetch(`http://${BASE_URL}/maquinas/obterSerialPorId`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar serial number da máquina");
        }

        const json = await response.json();
        //console.log(json);
        return json[0]?.serial_number ?? null;

    } catch (error) {
        console.error("Erro ao obter serial number:", error);
        return null;
    }
}



function converterHorasParaTexto(horasFloat) {
    const horas = Math.floor(horasFloat);
    const minutos = Math.round((horasFloat - horas) * 60);

    return `${horas} hora${horas !== 1 ? 's' : ''} e ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
}

function calcularTotalRAM(usoGB, percentualUso) {
    if (percentualUso === 0) return 0;
    const total = usoGB / (percentualUso / 100);
    return total.toFixed(2);
}

async function buscarThreshold(idMaquina) {
    try {
        const response = await fetch(`http://${BASE_URL}/medidas/thresholds/${idMaquina}`);
        const json = await response.json();
        thresholdData = json;


        atualizarGraficosComThreshold();
    } catch (error) {
        console.error('Erro ao buscar threshold:', error);
    }
}

function getUnitForTipo(tipo) {
    if (tipo.includes('_percent')) return '%';
    if (tipo.includes('_gb')) return 'GB';
    if (tipo.includes('_mbps')) return 'Mbps';
    if (tipo.includes('_ghz')) return 'GHz';
    if (tipo.includes('_hours')) return 'h';
    return ''; 
}

function criarAnotacoesThreshold(thresholdValues, tipoMetrica) {
    const annotations = [];
    const unit = getUnitForTipo(tipoMetrica);

    const thresholdLevels = [
        { key: 'leve', color: '#FFC300', label: 'Leve', offsetY: 0 },    
        { key: 'grave', color: '#FF5733', label: 'Grave', offsetY: -15 }, 
        { key: 'critico', color: '#E02519', label: 'Crítico', offsetY: 15 } 
    ];

    thresholdLevels.forEach(levelInfo => {
        const value = thresholdValues[levelInfo.key];
        if (value !== null && typeof value !== 'undefined') {
            annotations.push({
                y: value,
                borderColor: levelInfo.color,
                label: {
                    borderColor: levelInfo.color, 
                    style: {
                        color: '#fff', 
                        background: levelInfo.color, 
                        fontSize: '10px',
                        fontWeight: 'normal',
                        padding: { 
                            left: 5,
                            right: 5,
                            top: 2,
                            bottom: 2
                        }
                    },
                    text: `${levelInfo.label} (${value}${unit})`,
                    position: 'right', 
                    offsetX: 5,       
                    offsetY: levelInfo.offsetY 
                }
            });
        }
    });
    return annotations;
}

function atualizarGraficosComThreshold() {
    if (!thresholdData || thresholdData.length === 0) {
        console.warn("Dados de threshold ainda não carregados ou vazios.");
        return;
    }

    const graficosParaAtualizar = [
        { chart: chartCPU, tipo: 'cpu_percent' },
        { chart: chartMemoria, tipo: 'ram_percent' },
        { chart: chartDownload, tipo: 'net_download' }
    ];

    graficosParaAtualizar.forEach(item => {
        if (item.chart) { 
            const thresholdValues = getThreshold(item.tipo);
            const yaxisAnnotations = criarAnotacoesThreshold(thresholdValues, item.tipo);

            item.chart.updateOptions({
                annotations: {
                    yaxis: yaxisAnnotations.length > 0 ? yaxisAnnotations : [] 
                }
            });
        } else {
            console.warn(`Instância do gráfico para o tipo '${item.tipo}' não encontrada.`);
        }
    });
}

const getThreshold = (tipo) => {
    const thresholdConfig = thresholdData.find(item => item.tipo === tipo);
    if (thresholdConfig) {
        return {
            leve: thresholdConfig.threshold_leve,
            grave: thresholdConfig.threshold_grave,
            critico: thresholdConfig.threshold_critico
        };
    } else {
        console.warn(`Threshold não encontrado para o tipo: ${tipo}. Nenhum limite será plotado.`);
        return { leve: null, grave: null, critico: null }; 
    }
};

function inicializarGraficos() {
    chartCPU = new ApexCharts(document.querySelector("#chart"), {
        series: [{ name: "CPU %", data: [] }],
        chart: {
            type: 'line',
            height: 200
        },
        annotations: {
            yaxis: [
                {
                    y: 100,
                    borderColor: '#E02519',
                    label: {
                        text: 'Valor máximo',
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        },
        xaxis: { categories: [] },
        yaxis: {
            title: { text: 'Porcentagem (%)' },
            max: 100
        }
    });
    chartCPU.render();

    chartMemoria = new ApexCharts(document.querySelector("#chart2"), {
        series: [{ name: "Memória %", data: [] }],
        chart: {
            type: 'line',
            height: 200
        },
        annotations: {
            yaxis: [
                {
                    y: 100,
                    borderColor: '#E02519',
                    label: {
                        text: 'Valor máximo',
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        },
        xaxis: { categories: [] },
        yaxis: {
            title: { text: 'Porcentagem (%)' },
            max: 100
        }
    });
    chartMemoria.render();

    chartDownload = new ApexCharts(document.querySelector("#chartDownload"), {
        series: [{ name: "Download (Mbps)", data: [] }],
        chart: {
            type: 'line',
            height: 200
        },
        xaxis: {
            categories: []
        },
        yaxis: {
            title: { text: 'Porcentagem (%)' }
        }
    });
    chartDownload.render();


}

async function buscarMetricas(idMaquina) {
    try {
        const response = await fetch(`http://${BASE_URL}/medidas/${idMaquina}`);
        const json = await response.json();
        const dados = json.dados;

        // Verificações de existência dos dados
        if (!dados || Object.keys(dados).length === 0) {
            console.warn('Nenhum dado recebido da API.');
            return;
        }

        const cpuFreq = dados.cpu_freq?.length > 0 ? dados.cpu_freq.at(-1).valor.toFixed(2) : null;
        const cpuPercent = dados.cpu_percent?.[0]?.valor ?? null;
        const cpuUptime = dados.cpu_uptime ?? null;
        const ramUsed = dados.ram_usage_gb ?? null;
        const ramTotal = dados.ram_total ?? null;
        const ramPercent = dados.ram_percent?.[0]?.valor ?? null;
        const netDownload = dados.net_download?.[0]?.valor ?? null;
        const diskUsage = dados.disk_percent?.length > 0 ? dados.disk_percent.at(-1) : null;
        const diskUsedGB = dados.disk_usage_gb?.length > 0 ? dados.disk_usage_gb.at(-1) : null;
        const uptime = dados.uptime_hours?.length > 0 ? dados.uptime_hours.at(-1) : null;
        const netUsage = dados.net_usage_percent?.[0]?.valor ?? null;

        if (
            cpuFreq !== null ||
            cpuPercent !== null ||
            cpuUptime !== null ||
            ramUsed !== null ||
            ramTotal !== null ||
            ramPercent !== null ||
            netDownload !== null ||
            netUpload !== null ||
            diskUsage !== null ||
            diskUsedGB !== null ||
            uptime !== null ||
            netUsage !== null
        ) {
            atualizarBoxes({
                cpu_percent: cpuPercent,
                cpu_uptime: cpuUptime,
                ram_used: ramUsed,
                ram_total: ramTotal,
                ram_percent: ramPercent,
                net_download: netDownload,
                uptime: uptime,
                net_usage_percent: netUsage
            });
        }

        // Atualiza gráficos apenas se houver dados suficientes
        if (
            Array.isArray(dados.cpu_percent) &&
            Array.isArray(dados.ram_percent) &&
            Array.isArray(dados.net_download) &&
            Array.isArray(dados.net_usage_percent)
        ) {
            const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));
            const cpu = dados.cpu_percent.map(item => item.valor);
            const memoria = dados.ram_percent.map(item => item.valor);
            const netUsage = dados.net_usage_percent.map(item => item.valor);
            // const disco = dados.disk_percent.map(item => item.valor);

            atualizarGraficos({ cpu, memoria, timestamps, netUsage });
        }

    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
    }
}

function atualizarGraficos(dados) {

    // Atualiza os gráficos com os dados
    chartCPU.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartCPU.updateSeries([{ name: "CPU %", data: dados.cpu }]);
    chartCPU.update();

    chartMemoria.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartMemoria.updateSeries([{ name: "Memória %", data: dados.memoria }]);
    chartMemoria.update();


    chartDownload.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartDownload.updateSeries([{ name: "Download (Mbps)", data: dados.netUsage }]);
    chartDownload.update();

}

function atualizarBoxes(dados) {
    function validarDado(dado, valorPadrao = "Sem dados", casasDecimais = 2) {
        if (dado === null || dado === undefined || isNaN(dado)) {
            return valorPadrao;
        }
        return parseFloat(dado).toFixed(casasDecimais);
    }

    document.getElementById("cpuPercentKPI").textContent = validarDado(dados.cpu_percent, "Sem dados") + "%";
    document.getElementById("cpuUptimeKPI").textContent =
        dados.uptime && !isNaN(dados.uptime.valor)
            ? converterHorasParaTexto(dados.uptime.valor)
            : "Sem dados";


    document.getElementById("ramUsedKPI").textContent = validarDado(dados.ram_used[dados.ram_used.length - 1].valor, "Sem dados", 2) + " GB de " +
        validarDado(calcularTotalRAM(dados.ram_used[0].valor, dados.ram_percent), "Sem dados", 2) + " GB";
    document.getElementById("ramPercentKPI").textContent = validarDado(dados.ram_percent, "Sem dados") + "%";

    document.getElementById("downloadKPI").textContent = validarDado(dados.net_usage_percent, "Sem dados", 2) + "%";
}

async function buscarProcessos(idMaquina) {
    try {
        const response = await fetch(`http://${BASE_URL}/processos/${idMaquina}`);
        const json = await response.json();

        // Verifica se json e json.dados existem
        if (!json || !json.dados) {
            console.warn('Resposta da API não contém "dados".');
            return;
        }

        // Se a estrutura estiver mesmo como json.dados.undefined, precisamos extrair a chave real
        const chaves = Object.keys(json.dados);
        if (chaves.length === 0) {
            console.warn('Nenhum processo disponível na resposta.');
            return;
        }
        const chaveProcessos = chaves[0];
        const processos_vetor = json.dados[chaveProcessos];

        if (Array.isArray(processos_vetor) && processos_vetor.length > 0) {
            processosAtuais = processos_vetor;
            gerarCardsAcoes();
            const processosOrdenados = ordenarProcessos(processosAtuais, estadoOrdenacao.campo || 'cpu_percent', estadoOrdenacao.crescente);
            atualizarTabelaProcessos(processosOrdenados);
        } else {
            console.warn('Nenhum processo válido recebido.');
        }



    } catch (error) {
        console.error('Erro ao buscar processos:', error);
    }
}

async function buscarAlertas(serialNumber) {
    try {
        const response = await fetch(`http://${BASE_URL}/jira/tickets`);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);

        if (!Array.isArray(data)) {
            console.error("A resposta não contém um array de tickets.");
            return;
        }

        const ticketsFiltrados = data
            .filter(ticket =>
                ticket.summary.includes(serialNumber) &&
                ticket.requestTypeId === "5"
            )
            .map(ticket => {
                const date = new Date(ticket.createdDate.jira);
                const dia = String(date.getDate()).padStart(2, '0');
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const ano = date.getFullYear();
                const hora = String(date.getHours()).padStart(2, '0');
                const minuto = String(date.getMinutes()).padStart(2, '0');
                const textHoraAbertura = `${dia}/${mes}/${ano} às ${hora}:${minuto}`;

                const descricaoRaw = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value || "";
                const descricaoTratada = descricaoRaw;

                const idDispositivo = ticket.summary.split(" ")[1] || "N/A";
                const status = ticket.currentStatus?.status || "Desconhecido";

                return {
                    issueKey: ticket.issueKey,
                    descricaoTratada,
                    idDispositivo,
                    textHoraAbertura,
                    currentStatus: { status }
                };
            });

        alertasAtuais = ticketsFiltrados;

        const ordenados = ordenarAlertas(
            alertasAtuais,
            estadoOrdenacaoAlertas.campo || 'textHoraAbertura',
            estadoOrdenacaoAlertas.crescente
        );

        atualizarTabelaAlertas(ordenados);

    } catch (error) {
        console.error("Erro ao buscar tickets:", error);
    }
}


function gerarCardsAcoes() {
    const container = document.getElementById("hero-actions");
    container.innerHTML = ''; 
    let algumAlertaGerado = false;

    //Card de Chamados Abertos
    const chamadosAbertos = alertasAtuais.filter(alerta => alerta.currentStatus.status !== "Resolvido");
    if (chamadosAbertos.length > 0) {
        const cardChamados = document.createElement("div");
        cardChamados.className = "action-card critical";
        const primeiroChamado = chamadosAbertos[0];
        const dataAbertura = primeiroChamado ? primeiroChamado.textHoraAbertura : 'Data desconhecida';

        cardChamados.innerHTML = `
            <h3>⚠️ Chamados Abertos</h3>
            <p>${chamadosAbertos.length} chamado(s) não resolvido(s) desde ${dataAbertura}</p>
            <button onclick="abrirChamadoJira('${primeiroChamado.issueKey}')">Abrir no Jira</button>
        `;
        container.appendChild(cardChamados);
        algumAlertaGerado = true;
    } else {
        const cardSemChamados = document.createElement("div");
        cardSemChamados.className = "action-card success";
        cardSemChamados.innerHTML = `
            <h3>✅ Sem Chamados Abertos</h3>
            <p>Não há chamados pendentes no momento.</p>
        `;
        container.appendChild(cardSemChamados);
    }

    // Cards para Processos com Alto Consumo
    if (processosAtuais.length > 0) {
        const processosComUso = processosAtuais.filter(proc => proc.cpu_percent > 0 || proc.memory_percent > 0);

        if (processosComUso.length > 0) {
            const somaConsumo = processosComUso.reduce((total, proc) => total + proc.cpu_percent + proc.memory_percent, 0);
            const mediaConsumo = somaConsumo / processosComUso.length;
            const limiteAltoConsumo = mediaConsumo * 1.90;

            let processosAltoConsumo = processosAtuais.filter(proc => (proc.cpu_percent + proc.memory_percent) > limiteAltoConsumo);

            if (processosAltoConsumo.length > 0) {
                processosAltoConsumo.sort((a, b) => (b.cpu_percent + b.memory_percent) - (a.cpu_percent + b.memory_percent));
                const top3ProcessosAltoConsumo = processosAltoConsumo.slice(0, 3);

                top3ProcessosAltoConsumo.forEach(processo => {
                    const consumoTotal = (processo.cpu_percent + processo.memory_percent).toFixed(1);
                    const cardProcessoAltoConsumo = document.createElement("div");
                    cardProcessoAltoConsumo.className = "action-card warning";
                    cardProcessoAltoConsumo.innerHTML = `
                        <h3>🔥 Alto Consumo: ${processo.nome}</h3>
                        <p>Consumindo aproximadamente <strong>${consumoTotal}%</strong> (CPU + RAM), mais de 90% acima da média dos processos ativos (${mediaConsumo.toFixed(1)}%).</p>
                        <button onclick="confirmarEncerrarProcesso(${processo.pid}, '${processo.nome}')">Encerrar Processo</button>
                    `;
                    container.appendChild(cardProcessoAltoConsumo);
                    algumAlertaGerado = true;
                });
            } else {
                const cardSemAltoConsumo = document.createElement("div");
                cardSemAltoConsumo.className = "action-card success";
                cardSemAltoConsumo.innerHTML = `
                    <h3>✅ Sem Alto Consumo de Processos</h3>
                    <p>Nenhum processo com consumo significativamente acima da média.</p>
                `;
                container.appendChild(cardSemAltoConsumo);
                if (chamadosAbertos.length === 0) algumAlertaGerado = true;
            }
        } else {
            const cardSemProcessosAtivos = document.createElement("div");
            cardSemProcessosAtivos.className = "action-card info";
            cardSemProcessosAtivos.innerHTML = `
                <h3>ℹ️ Sem Processos Ativos</h3>
                <p>Não há processos ativos para verificar o consumo.</p>
            `;
            container.appendChild(cardSemProcessosAtivos);
            if (chamadosAbertos.length === 0) algumAlertaGerado = true;
        }
    } else {
        const cardSemProcessos = document.createElement("div");
        cardSemProcessos.className = "action-card info";
        cardSemProcessos.innerHTML = `
            <h3>ℹ️ Sem Dados de Processos</h3>
            <p>Não há dados de processos disponíveis para análise.</p>
        `;
        container.appendChild(cardSemProcessos);
        if (chamadosAbertos.length === 0) algumAlertaGerado = true;
    }


}

function abrirChamadoJira(issueKey) {
    const jiraUrlBase = "https://sentinelacomvc.atlassian.net/browse/";
    window.open(jiraUrlBase + issueKey, '_blank');
}



function atualizarTabelaAlertas(alertas) {
    const tabelaBody = document.getElementById("tabela-chamados-body");
    tabelaBody.innerHTML = "";


    if (!alertas || alertas.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="5">Nenhum chamado encontrado.</td></tr>`;
        return;
    }

    alertas.forEach(alerta => {
        const row = tabelaBody.insertRow();

        let cellChave = row.insertCell();
        cellChave.textContent = alerta.issueKey;

        let cellDescricao = row.insertCell();
        cellDescricao.textContent = alerta.descricaoTratada;

        let cellDispositivo = row.insertCell();
        cellDispositivo.textContent = alerta.idDispositivo;

        let cellData = row.insertCell();
        cellData.textContent = alerta.textHoraAbertura;

        let cellStatus = row.insertCell();
        cellStatus.textContent = alerta.currentStatus.status;

        // Nova célula para o botão do Jira
        let cellAcao = row.insertCell();
        const botaoJira = document.createElement('button');
        botaoJira.textContent = 'Abrir no Jira';
        botaoJira.onclick = function() {
            abrirChamadoJira(alerta.issueKey);
        };
        cellAcao.appendChild(botaoJira);
    });
}


function ordenarAlertas(array, campo, crescente = true) {
    return [...array].sort((a, b) => {
        let valA = a[campo];
        let valB = b[campo];

        if (campo === 'textHoraAbertura') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (typeof valA === 'string') {
            return crescente ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return crescente ? valA - valB : valB - valA;
    });
}


function ordenarPor(campo) {
    if (estadoOrdenacao.campo === campo) {
        estadoOrdenacao.crescente = !estadoOrdenacao.crescente;
    } else {
        estadoOrdenacao.campo = campo;
        estadoOrdenacao.crescente = true;
    }

    const processosOrdenados = ordenarProcessos(processosAtuais, campo, estadoOrdenacao.crescente);
    atualizarTabelaProcessos(processosOrdenados);
    atualizarSetasOrdenacao();
}

function atualizarSetasOrdenacao() {
    const campos = ['pid', 'nome', 'cpu_percent', 'memory_percent'];

    campos.forEach(campo => {
        const mapaIds = {
            pid: 'seta-pid',
            nome: 'seta-nome',
            cpu_percent: 'seta-cpu',
            memory_percent: 'seta-ram'
        };
        const setaEl = document.getElementById(mapaIds[campo]);
        if (!setaEl) return;

        if (estadoOrdenacao.campo === campo) {
            setaEl.textContent = estadoOrdenacao.crescente ? '🔼' : '🔽';
        } else {
            setaEl.textContent = '';
        }
    });
}



function ordenarProcessos(array, campo, crescente = true) {
    if (campo === "timestamp") {
        throw new Error("Ordenação por 'timestamp' não é permitida.");
    }

    return [...array].sort((a, b) => {
        if (typeof a[campo] === "string") {
            return crescente
                ? a[campo].localeCompare(b[campo])
                : b[campo].localeCompare(a[campo]);
        }

        return crescente ? a[campo] - b[campo] : b[campo] - a[campo];
    });
}

function atualizarTabelaProcessos(processos) {
    const tbody = document.getElementById('tabela-processos-body');
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        let proc = processos[i];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.nome}</td>
            <td>${proc.cpu_percent.toFixed(1)}%</td>
            <td>${proc.memory_percent.toFixed(1)}%</td>
        `;
        tbody.appendChild(row);

    }
  
}

function ordenarTabelaAlertasPor(campo) {
    if (estadoOrdenacaoAlertas.campo === campo) {
        estadoOrdenacaoAlertas.crescente = !estadoOrdenacaoAlertas.crescente;
    } else {
        estadoOrdenacaoAlertas.campo = campo;
        estadoOrdenacaoAlertas.crescente = true;
    }

    const ordenados = ordenarAlertas(alertasAtuais, campo, estadoOrdenacaoAlertas.crescente);
    atualizarTabelaAlertas(ordenados);
}

function confirmarEncerrarProcesso(pid, nome) {
    if (confirm(`Tem certeza que deseja encerrar o processo ${nome} (PID: ${pid})?`)) {
        const id_maquina = id;
        const tipo_comando = "encerrar_processo";

        fetch(`/processos/matarProcesso/${id_maquina}`, {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pid: pid,
                tipo_comando: tipo_comando
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Erro desconhecido na requisição.');
                });
            }
            return response.json(); 
        })
        .then(data => {
           //  console.log("Sucesso ao enviar comando:", data);
            alert("Comando de encerramento enviado com sucesso! O processo será encerrado em breve.");

        })
        .catch(error => {
            console.error("Erro ao enviar comando de encerramento:", error);
            alert(`Erro ao tentar encerrar o processo: ${error.message}. Por favor, tente novamente.`);
        });

    } else {
        console.log("Encerramento do processo cancelado pelo usuário.");
    }
}

function enviarComandoEncerrarProcesso(pid) {

}




inicializarGraficos();
if (id) {
    buscarMetricas(id);
    buscarThreshold(id);
    buscarProcessos(id);

    obterSerialPorId(id).then(serial => {
        if (serial) {
            // console.log(serial[0].serial_number)
            buscarAlertas(serial[0].serial_number);
        } else {
            console.warn("Serial não encontrado. Não será possível buscar alertas.");
        }
    });

    intervaloAtualizacao = setInterval(() => {
        buscarMetricas(id);
        buscarThreshold(id);
        buscarProcessos(id);
        obterSerialPorId(id).then(serial => {
            if (serial) {
                buscarAlertas(serial);
            } else {
                console.warn("Serial não encontrado. Não será possível buscar alertas.");
            }
        });
    }, 5000);





    intervaloProcessosAlertas = setInterval(() => {
        obterSerialPorId(id).then(serial => {
            if (serial) {
                buscarAlertas(serial);
            } else {
                console.warn("Serial não encontrado. Não será possível buscar alertas.");
            }
        });
    }, 10000)
}


