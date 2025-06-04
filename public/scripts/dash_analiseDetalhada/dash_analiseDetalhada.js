const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

// Lógica de redirecionamento:
if (!id) {
    console.warn("ID da máquina não fornecido na URL. Redirecionando para a página de lista de máquinas.");
    window.location.href = '../html/lista_de_maquinas.html'; 
    throw new Error("Redirecionamento: ID da máquina ausente."); 
}

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
let processosAtuais = [];
let alertasAtuais = [];
let estadoOrdenacaoAlertas = {
    campo: null,
    crescente: true
};

// --- NOVAS FLAGS DE STATUS DE DADOS ---
let hasCpuRamNetData = false; // Indica se há dados para CPU, RAM, Rede (gráficos/KPIs)
let hasProcessData = false;   // Indica se há dados de processos
let hasAlertData = false;     // Indica se há dados de alertas
let hasAnyData = false;       // Indica se há qualquer dado em alguma seção

// Referências aos elementos principais de conteúdo
const section1Content = document.getElementById('section1_content');
const section2Content = document.getElementById('section2_content');
const noDataMessage = document.getElementById('noDataMessage');

// Adicionando evento de click nos headers da tabela
document.getElementById('th-pid').addEventListener('click', () => ordenarPor('pid'));
document.getElementById('th-nome').addEventListener('click', () => ordenarPor('nome'));
document.getElementById('th-cpu').addEventListener('click', () => ordenarPor('cpu_percent'));
document.getElementById('th-ram').addEventListener('click', () => ordenarPor('memory_percent'));

document.getElementById("th-chave").addEventListener("click", () => ordenarTabelaAlertasPor("issueKey"));
document.getElementById("th-desc").addEventListener("click", () => ordenarTabelaAlertasPor("descricaoTratada"));
document.getElementById("th-disp").addEventListener("click", () => ordenarTabelaAlertasPor("idDispositivo"));
document.getElementById("th-data").addEventListener("click", () => ordenarTabelaAlertasPor("textHoraAbertura"));


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
    if (percentualUso === 0 || percentualUso === null || percentualUso === undefined) return 0; 
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

        if (!dados || Object.keys(dados).length === 0 || 
            (!Array.isArray(dados.cpu_percent) || dados.cpu_percent.length === 0) &&
            (!Array.isArray(dados.ram_percent) || dados.ram_percent.length === 0) &&
            (!Array.isArray(dados.net_download) || dados.net_download.length === 0) &&
            (!Array.isArray(dados.net_usage_percent) || dados.net_usage_percent.length === 0)
        ) {
            console.warn('Nenhum dado de CPU, RAM ou Rede recebido da API.');
            hasCpuRamNetData = false;
            document.querySelector('.container-graphs').style.display = 'none';
            return;
        }

        hasCpuRamNetData = true; 
        document.querySelector('.container-graphs').style.display = 'flex'; 

        const cpuFreq = dados.cpu_freq?.length > 0 ? dados.cpu_freq.at(-1).valor.toFixed(2) : null;
        const cpuPercent = dados.cpu_percent?.[0]?.valor ?? null;
        const cpuUptime = dados.uptime_hours?.[0]?.valor ?? null; 
        const ramUsed = dados.ram_usage_gb ?? null;
        const ramTotal = dados.ram_total ?? null; 
        const ramPercent = dados.ram_percent?.[0]?.valor ?? null;
        const netDownload = dados.net_download?.[0]?.valor ?? null;
        const netUsage = dados.net_usage_percent?.[0]?.valor ?? null;

        atualizarBoxes({
            cpu_percent: cpuPercent,
            cpu_uptime: cpuUptime,
            ram_used: ramUsed,
            ram_total: ramTotal,
            ram_percent: ramPercent,
            net_download: netDownload,
            uptime: { valor: cpuUptime }, 
            net_usage_percent: netUsage
        });
        
        const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));
        const cpu = dados.cpu_percent.map(item => item.valor);
        const memoria = dados.ram_percent.map(item => item.valor);
        const netUsageData = dados.net_usage_percent.map(item => item.valor); 

        atualizarGraficos({ cpu, memoria, timestamps, netUsage: netUsageData });

    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        hasCpuRamNetData = false;
        document.querySelector('.container-graphs').style.display = 'none'; 
    } finally {
        checkOverallDataStatus(); 
    }
}

function atualizarGraficos(dados) {
    chartCPU.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartCPU.updateSeries([{ name: "CPU %", data: dados.cpu }]);

    chartMemoria.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartMemoria.updateSeries([{ name: "Memória %", data: dados.memoria }]);

    chartDownload.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartDownload.updateSeries([{ name: "Uso da Rede (%)", data: dados.netUsage }]);
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

    const ramUsedValue = Array.isArray(dados.ram_used) && dados.ram_used.length > 0 ? dados.ram_used[dados.ram_used.length - 1].valor : dados.ram_used;
    const ramPercentValue = Array.isArray(dados.ram_percent) && dados.ram_percent.length > 0 ? dados.ram_percent[0].valor : dados.ram_percent;

    const ramTotalCalculado = calcularTotalRAM(ramUsedValue, ramPercentValue);

    document.getElementById("ramUsedKPI").textContent = 
        validarDado(ramUsedValue, "Sem dados", 2) + " GB de " +
        validarDado(ramTotalCalculado, "Sem dados", 2) + " GB";
    document.getElementById("ramPercentKPI").textContent = validarDado(ramPercentValue, "Sem dados") + "%";

    document.getElementById("downloadKPI").textContent = validarDado(dados.net_usage_percent, "Sem dados", 2) + "%"; 
}

async function buscarProcessos(idMaquina) {
    try {
        const response = await fetch(`http://${BASE_URL}/processos/${idMaquina}`);
        const json = await response.json();

        const chaves = Object.keys(json.dados || {}); 
        const processos_vetor = chaves.length > 0 ? json.dados[chaves[0]] : [];

        if (!Array.isArray(processos_vetor) || processos_vetor.length === 0) {
            console.warn('Nenhum processo válido recebido.');
            hasProcessData = false;
            document.querySelector('.section2 .containerComponent:nth-child(1)').style.display = 'none'; 
            document.getElementById("hero-actions").style.display = 'none'; 
            return;
        }

        hasProcessData = true; 
        document.querySelector('.section2 .containerComponent:nth-child(1)').style.display = 'flex'; 
        document.getElementById("hero-actions").style.display = 'flex'; 

        processosAtuais = processos_vetor;
        gerarCardsAcoes('loaded'); // Chama com 'loaded' para popular os cards de ação
        const processosOrdenados = ordenarProcessos(processosAtuais, estadoOrdenacao.campo || 'cpu_percent', estadoOrdenacao.crescente);
        atualizarTabelaProcessos(processosOrdenados);

    } catch (error) {
        console.error('Erro ao buscar processos:', error);
        hasProcessData = false;
        document.querySelector('.section2 .containerComponent:nth-child(1)').style.display = 'none'; 
        document.getElementById("hero-actions").style.display = 'none'; 
    } finally {
        checkOverallDataStatus(); 
    }
}

async function buscarAlertas(serialNumber) {
    // A chamada a gerarCardsAcoes('loading') foi movida para o Promise.all inicial
    // const containerHeroActions = document.getElementById("hero-actions"); // Não é mais necessário aqui
    
    try {
        const response = await fetch(`http://${BASE_URL}/jira/tickets`);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("A resposta não contém um array de tickets válidos.");
            hasAlertData = false;
            document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'none'; 
            gerarCardsAcoes('no_alerts'); // Chama com 'no_alerts' para exibir o card de "sem chamados"
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
        
        if (ticketsFiltrados.length === 0) {
            console.warn("Nenhum alerta filtrado para este serial number.");
            hasAlertData = false;
            document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'none';
            gerarCardsAcoes('no_alerts'); // Chama com 'no_alerts'
            return;
        }

        hasAlertData = true; 
        document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'flex'; 

        alertasAtuais = ticketsFiltrados;

        const ordenados = ordenarAlertas(
            alertasAtuais,
            estadoOrdenacaoAlertas.campo || 'textHoraAbertura',
            estadoOrdenacaoAlertas.crescente
        );

        atualizarTabelaAlertas(ordenados);
        gerarCardsAcoes('loaded'); // Chama com 'loaded' após sucesso

    } catch (error) {
        console.error("Erro ao buscar tickets:", error);
        hasAlertData = false;
        document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'none'; 
        gerarCardsAcoes('error'); // Chama com 'error' em caso de falha
    } finally {
        checkOverallDataStatus(); 
    }
}

function checkOverallDataStatus() {
    hasAnyData = hasCpuRamNetData || hasProcessData || hasAlertData;

    if (hasAnyData) {
        noDataMessage.style.display = 'none'; 
        section1Content.style.display = 'flex'; 
        section2Content.style.display = 'flex'; 
    } else {
        noDataMessage.style.display = 'block'; 
        section1Content.style.display = 'none'; 
        section2Content.style.display = 'none'; 
    }
}

// --- FUNÇÃO GERAR CARDS DE AÇÕES MODIFICADA ---
function gerarCardsAcoes(status = 'loaded') { // Adicionado parâmetro 'status'
    const container = document.getElementById("hero-actions");
    container.innerHTML = ''; // Limpa o conteúdo anterior

    if (status === 'loading') {
        container.innerHTML = `
            <div class="action-card info" style="text-align: center; width: 100%;">
                <h3>⏳ Carregando chamados e processos...</h3>
                <p>Aguarde enquanto buscamos os dados.</p>
            </div>
        `;
        return; // Sai da função para não popular outros cards
    } else if (status === 'error') {
        container.innerHTML = `
            <div class="action-card critical" style="text-align: center; width: 100%;">
                <h3>❌ Erro ao Carregar Dados</h3>
                <p>Não foi possível carregar os chamados ou processos. Tente novamente mais tarde.</p>
            </div>
        `;
        return; // Sai da função
    }

    // Lógica para Chamados Abertos (agora dentro do status 'loaded' ou 'no_alerts')
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
    } else if (status === 'no_alerts' || alertasAtuais.length === 0) { // Se não houver alertas filtrados ou nenhum alerta
        const cardSemChamados = document.createElement("div");
        cardSemChamados.className = "action-card success";
        cardSemChamados.innerHTML = `
            <h3>✅ Sem Chamados Abertos</h3>
            <p>Não há chamados pendentes no momento.</p>
        `;
        container.appendChild(cardSemChamados);
    }

    // Lógica para Processos com Alto Consumo (agora dentro do status 'loaded')
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
                });
            } else {
                const cardSemAltoConsumo = document.createElement("div");
                cardSemAltoConsumo.className = "action-card success";
                cardSemAltoConsumo.innerHTML = `
                    <h3>✅ Sem Alto Consumo de Processos</h3>
                    <p>Nenhum processo com consumo significativamente acima da média.</p>
                `;
                container.appendChild(cardSemAltoConsumo);
            }
        } else {
            const cardSemProcessosAtivos = document.createElement("div");
            cardSemProcessosAtivos.className = "action-card info";
            cardSemProcessosAtivos.innerHTML = `
                <h3>ℹ️ Sem Processos Ativos</h3>
                <p>Não há processos ativos para verificar o consumo.</p>
            `;
            container.appendChild(cardSemProcessosAtivos);
        }
    } else {
        const cardSemProcessos = document.createElement("div");
        cardSemProcessos.className = "action-card info";
        cardSemProcessos.innerHTML = `
            <h3>ℹ️ Sem Dados de Processos</h3>
            <p>Não há dados de processos disponíveis para análise.</p>
        `;
        container.appendChild(cardSemProcessos);
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
            return crescente ? valA.localeCompare(valB) : valB.localeCompare(a[campo]); // Corrigido b[campo].localeCompare(a[campo])
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
    const processosParaExibir = processos.slice(0, 10); 
    processosParaExibir.forEach(proc => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.nome}</td>
            <td>${proc.cpu_percent.toFixed(1)}%</td>
            <td>${proc.memory_percent.toFixed(1)}%</td>
            <td><button class="kill-process-btn" onclick="confirmarEncerrarProcesso(${proc.pid}, '${proc.nome}')">
                    ❌ 
                </button></td>
        `;
        tbody.appendChild(row);
    });
    if (processosParaExibir.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Nenhum processo em execução.</td></tr>`;
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
    const modalConfirm = document.createElement('div');
    modalConfirm.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
    `;
    modalConfirm.innerHTML = `
        <div style="
            background-color: white; padding: 20px; border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 400px; text-align: center;
        ">
            <h3>Confirmar Encerramento</h3>
            <p>Tem certeza que deseja encerrar o processo ${nome} (PID: ${pid})?</p>
            <button id="confirmYes" style="
                background-color: #f44336; color: white; border: none; padding: 10px 20px;
                margin: 10px; border-radius: 5px; cursor: pointer;
            ">Sim</button>
            <button id="confirmNo" style="
                background-color: #ccc; color: black; border: none; padding: 10px 20px;
                margin: 10px; border-radius: 5px; cursor: pointer;
            ">Não</button>
        </div>
    `;
    document.body.appendChild(modalConfirm);

    document.getElementById('confirmYes').onclick = () => {
        modalConfirm.remove();
        const id_maquina = id;
        const tipo_comando = "encerrar_processo";

        fetch(`http://${BASE_URL}/processos/matarProcesso/${id_maquina}`, {
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
            showCustomMessage("Comando de encerramento enviado com sucesso! O processo será encerrado em breve.", "success");
        })
        .catch(error => {
            console.error("Erro ao enviar comando de encerramento:", error);
            showCustomMessage(`Erro ao tentar encerrar o processo: ${error.message}. Por favor, tente novamente.`, "error");
        });
    };

    document.getElementById('confirmNo').onclick = () => {
        modalConfirm.remove();
        console.log("Encerramento do processo cancelado pelo usuário.");
    };
}

function showCustomMessage(message, type = "info") {
    const modalMessage = document.createElement('div');
    modalMessage.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1001;
    `;
    let bgColor = '#4CAF50'; 
    if (type === 'error') bgColor = '#f44336'; 
    if (type === 'warning') bgColor = '#ff9800'; 
    if (type === 'info') bgColor = '#2196F3'; 

    modalMessage.innerHTML = `
        <div style="
            background-color: white; padding: 20px; border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 400px; text-align: center;
        ">
            <p>${message}</p>
            <button id="messageOk" style="
                background-color: ${bgColor}; color: white; border: none; padding: 10px 20px;
                margin-top: 15px; border-radius: 5px; cursor: pointer;
            ">OK</button>
        </div>
    `;
    document.body.appendChild(modalMessage);

    document.getElementById('messageOk').onclick = () => {
        modalMessage.remove();
    };
}


inicializarGraficos();

// Exibir estado de carregamento ANTES de iniciar todas as buscas
gerarCardsAcoes('loading'); // <-- Chamada inicial de carregamento

// Chamar todas as funções de busca de dados
Promise.all([
    buscarMetricas(id),
    buscarThreshold(id), 
    buscarProcessos(id),
    obterSerialPorId(id).then(serial => {
        if (serial) {
            return buscarAlertas(serial); 
        } else {
            console.warn("Serial não encontrado. Não será possível buscar alertas.");
            hasAlertData = false; 
            document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'none';
            gerarCardsAcoes('no_alerts'); // Exibe o card de "sem chamados" se o serial não for encontrado
            return Promise.resolve(); 
        }
    })
]).then(() => {
    checkOverallDataStatus(); 
}).catch(error => {
    console.error("Erro em uma das buscas iniciais de dados:", error);
    checkOverallDataStatus(); 
});


intervaloAtualizacao = setInterval(async () => {
    await Promise.all([
        buscarMetricas(id),
        buscarThreshold(id),
        buscarProcessos(id),
        obterSerialPorId(id).then(serial => {
            if (serial) {
                return buscarAlertas(serial);
            } else {
                console.warn("Serial não encontrado. Não será possível buscar alertas.");
                hasAlertData = false;
                document.querySelector('.section2 .containerComponent:nth-child(2)').style.display = 'none';
                gerarCardsAcoes('no_alerts'); // Exibe o card de "sem chamados" se o serial não for encontrado
                return Promise.resolve();
            }
        })
    ]);
}, 5000);
