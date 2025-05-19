const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

const BASE_URL = window.location.hostname === "localhost"
    ? "localhost:3333"
    : "18.208.5.45:3333";

let chartCPU, chartMemoria, chartRede, chartDisco, chartDownload, chartUpload;
let intervaloAtualizacao;
let thresholdData = [];

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

function calcularCapacidadeDisco(gbEmUso, percentualUso) {
    if (percentualUso === 0) return { capacidadeTotal: 0, capacidadeLivre: 0 };

    const capacidadeTotal = gbEmUso / (percentualUso / 100);
    const capacidadeLivre = capacidadeTotal - gbEmUso;

    return {
        capacidadeTotal: capacidadeTotal.toFixed(2),
        capacidadeLivre: capacidadeLivre.toFixed(2)
    };
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

function atualizarGraficosComThreshold() {
    chartCPU.updateOptions({
        annotations: {
            yaxis: [
                {
                    y: getThreshold('cpu_percent').max,
                    borderColor: '#E02519',
                    label: {
                        text: `Threshold (${getThreshold('cpu_percent').max}%)`,
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        }
    });

    chartMemoria.updateOptions({
        annotations: {
            yaxis: [
                {
                    y: getThreshold('ram_percent').max,
                    borderColor: '#E02519',
                    label: {
                        text: `Threshold (${getThreshold('ram_percent').max}%)`,
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        }
    });

    chartDownload.updateOptions({
        annotations: {
            yaxis: [
                {
                    y: getThreshold('net_download').max,
                    borderColor: '#E02519',
                    label: {
                        text: `Threshold (${getThreshold('net_download').max}%)`,
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        }
    });

    chartUpload.updateOptions({
        annotations: {
            yaxis: [
                {
                    y: getThreshold('net_upload').max,
                    borderColor: '#E02519',
                    label: {
                        text: `Threshold (${getThreshold('net_upload').max}%)`,
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        }
    });

    chartDisco.updateOptions({
        annotations: {
            yaxis: [
                {
                    y: getThreshold('disk_percent').max,
                    borderColor: '#E02519',
                    label: {
                        text: `Threshold (${getThreshold('disk_percent').max}%)`,
                        style: {
                            color: '#E02519',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }
            ]
        }
    });
}

const getThreshold = (tipo) => {
    const threshold = thresholdData.find(item => item.tipo === tipo);
    if (threshold) {
        return { max: threshold.maximo };
    } else {
        console.error(`Threshold não encontrado para o tipo: ${tipo}`);
        return { max: 100 };
    }
}

function inicializarGraficos() {
    chartCPU = new ApexCharts(document.querySelector("#chart"), {
        series: [{ name: "CPU %", data: [] }],
        chart: {
            type: 'line',
            height: 350
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
            height: 350
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
            height: 350
        },
        xaxis: {
            categories: []
        },
        yaxis: {
            title: { text: 'Velocidade (Mbps)' }
        }
    });
    chartDownload.render();

    chartUpload = new ApexCharts(document.querySelector("#chartUpload"), {
        series: [{ name: "Upload (Mbps)", data: [] }],
        chart: {
            type: 'line',
            height: 350
        },
        xaxis: {
            categories: []
        },
        yaxis: {
            title: { text: 'Velocidade (Mbps)' }
        }
    });
    chartUpload.render();

    chartDisco = new ApexCharts(document.querySelector("#chart6"), {
        series: [{ name: "Disco %", data: [] }],
        chart: {
            type: 'line',
            height: 350
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
            max: 100,
        }
    });
    chartDisco.render();
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
        const netUpload = dados.net_upload?.[0]?.valor ?? null;
        const diskUsage = dados.disk_percent?.length > 0 ? dados.disk_percent.at(-1) : null;
        const diskUsedGB = dados.disk_usage_gb?.length > 0 ? dados.disk_usage_gb.at(-1) : null;
        const uptime = dados.uptime_hours?.length > 0 ? dados.uptime_hours.at(-1) : null;

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
            uptime !== null
        ) {
            atualizarBoxes({
                cpu_freq: cpuFreq,
                cpu_percent: cpuPercent,
                cpu_uptime: cpuUptime,
                ram_used: ramUsed,
                ram_total: ramTotal,
                ram_percent: ramPercent,
                net_download: netDownload,
                net_upload: netUpload,
                disk_usage: diskUsage,
                disk_used_gb: diskUsedGB,
                uptime: uptime
            });
        }

        // Atualiza gráficos apenas se houver dados suficientes
        if (
            Array.isArray(dados.cpu_percent) &&
            Array.isArray(dados.ram_percent) &&
            Array.isArray(dados.net_download) &&
            Array.isArray(dados.net_upload) &&
            Array.isArray(dados.disk_percent)
        ) {
            const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));
            const cpu = dados.cpu_percent.map(item => item.valor);
            const memoria = dados.ram_percent.map(item => item.valor);
            const download = dados.net_download.map(item => (item.valor * 1024).toFixed(2));
            const upload = dados.net_upload.map(item => (item.valor * 1024).toFixed(2));
            const disco = dados.disk_percent.map(item => item.valor);

            atualizarGraficos({ cpu, memoria, download, upload, disco, timestamps });
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
    chartDownload.updateSeries([{ name: "Download (Mbps)", data: dados.download }]);
    chartDownload.update();

    chartUpload.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartUpload.updateSeries([{ name: "Upload (Mbps)", data: dados.upload }]);
    chartUpload.update();

    chartDisco.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartDisco.updateSeries([{ name: "Disco %", data: dados.disco }]);
    chartDisco.update();
}

function atualizarBoxes(dados) {
    function validarDado(dado, valorPadrao = "Sem dados", casasDecimais = 2) {
        if (dado === null || dado === undefined || isNaN(dado)) {
            return valorPadrao;
        }
        return parseFloat(dado).toFixed(casasDecimais);
    }

    document.getElementById("cpuFreqKPI").textContent = validarDado(dados.cpu_freq, "Sem dados", 2) + " GHz";
    document.getElementById("cpuPercentKPI").textContent = validarDado(dados.cpu_percent, "Sem dados") + "%";
    document.getElementById("cpuUptimeKPI").textContent = 
    dados.uptime && !isNaN(dados.uptime.valor)
        ? converterHorasParaTexto(dados.uptime.valor)
        : "Sem dados";


    document.getElementById("ramUsedKPI").textContent = validarDado(dados.ram_used[dados.ram_used.length - 1].valor, "Sem dados", 2) + " GB de " +
        validarDado(calcularTotalRAM(dados.ram_used[0].valor, dados.ram_percent), "Sem dados", 2) + " GB";
    document.getElementById("ramPercentKPI").textContent = validarDado(dados.ram_percent, "Sem dados") + "%";

    document.getElementById("downloadKPI").textContent = validarDado(dados.net_download, "Sem dados", 6) + " mbps";

    document.getElementById("uploadKPI").textContent = validarDado(dados.net_upload, "Sem dados", 6) + " mbps";

    document.getElementById("diskFreeKPI").textContent = validarDado(calcularCapacidadeDisco(dados.disk_used_gb.valor, dados.disk_usage.valor).capacidadeLivre, "Sem dados", 2) + " GB";
    document.getElementById("diskUsedKPI").textContent = validarDado(dados.disk_used_gb.valor, "Sem dados", 2) + " GB";
    document.getElementById("diskTotalKPI").textContent = validarDado(calcularCapacidadeDisco(dados.disk_used_gb.valor, dados.disk_usage.valor).capacidadeTotal, "Sem dados", 2) + " GB";
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
            atualizarTabelaProcessos(processos_vetor);
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
        console.log("Resposta da API:", data);

        if (!Array.isArray(data.values)) {
            console.error("A resposta não contém um array de tickets.");
            return;
        }

        const tabelaBody = document.getElementById("tabela-chamados-body");
        tabelaBody.innerHTML = ""; // Limpa a tabela

        // Filtra os tickets que têm o serial no summary e tipo correto
        const ticketsFiltrados = data.values.filter(ticket =>
            ticket.summary.includes(serialNumber) && ticket.requestTypeId === "68"
        );

        if (ticketsFiltrados.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="5">Nenhum chamado encontrado para o serial informado.</td>
                </tr>
            `;
            return;
        }

        ticketsFiltrados.forEach(ticket => {
            const date = new Date(ticket.createdDate.jira);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            const hora = String(date.getHours()).padStart(2, '0');
            const minuto = String(date.getMinutes()).padStart(2, '0');
            const textHoraAbertura = `${dia}/${mes}/${ano} às ${hora}:${minuto}`;

            const descricaoRaw = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value || "";
            const descricaoSeparada = descricaoRaw.split('*');
            const descricaoTratada = descricaoSeparada[3]
                ? descricaoSeparada[3].charAt(0).toUpperCase() + descricaoSeparada[3].slice(1)
                : "Sem descrição";

            const idDispositivo = ticket.summary.split(" ")[1] || "N/A";
            const status = ticket.currentStatus?.status || "Desconhecido";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="alerta-chave">${ticket.issueKey}</td>
                <td>${descricaoTratada}</td>
                <td class="alerta-dispositivo">${idDispositivo}</td>
                <td class="alerta-horario">${textHoraAbertura}</td>
                <td><span class="status-badge status-resolvido">${status}</span></td>
            `;
            tabelaBody.appendChild(row);
        });

    } catch (error) {
        console.error("Erro ao buscar tickets:", error);
    }
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
    processos.forEach(proc => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.nome}</td>
            <td>${proc.cpu_percent.toFixed(1)}%</td>
            <td>${proc.memory_percent.toFixed(1)}%</td>
        `;
        tbody.appendChild(row);
    });
}



inicializarGraficos();
if (id) {
    buscarMetricas(id);
    buscarThreshold(id);
    buscarProcessos(id);

    obterSerialPorId(id).then(serial => {
        if (serial) {
            console.log(serial[0].serial_number)
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
}

// Botão de pesquisa manual
document.getElementById('confirm_button').addEventListener('click', async () => {
    const serialDigitado = document.querySelector('#select_modelo input').value;

    if (serialDigitado) {
        try {
            const response = await fetch(`http://${BASE_URL}/maquinas/serial/${serialDigitado}`);
            const dadosSerial = await response.json();
            const idMaquina = dadosSerial[0].id_maquina;

            // console.log(dadosSerial)

            clearInterval(intervaloAtualizacao);

            id = idMaquina;
            buscarMetricas(id);

            intervaloAtualizacao = setInterval(() => {
                buscarMetricas(id);
                buscarThreshold(id);
            }, 5000);

        } catch (error) {
            console.error('Erro ao buscar ID pelo serial:', error);
        }
    }
});

