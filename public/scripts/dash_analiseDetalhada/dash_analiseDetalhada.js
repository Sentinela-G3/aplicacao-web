const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

const BASE_URL = window.location.hostname === "localhost"
  ? "localhost:3333"
  : "18.208.5.45:3333";

let chartCPU, chartMemoria, chartRede, chartDisco, chartDownload, chartUpload;
let intervaloAtualizacao;
let thresholdData = [];

// Funções auxiliares para cálculos e conversões

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
        console.log("Thresholds carregados:", thresholdData);
        
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
        return {max: 100 };  
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

        console.log(dados)

        atualizarBoxes({
            cpu_freq: dados.cpu_freq[dados.cpu_freq.length - 1].valor.toFixed(2),
            cpu_percent: dados.cpu_percent[0]?.valor ?? 0,
            cpu_uptime: dados.cpu_uptime,
            ram_used: dados.ram_usage_gb,
            ram_total: dados.ram_total,
            ram_percent: dados.ram_percent[0]?.valor ?? 0,
            net_download: dados.net_download[0]?.valor ?? 0,
            net_upload: dados.net_upload[0]?.valor ?? 0,
            disk_usage: dados.disk_percent[dados.disk_percent.length - 1],
            disk_used_gb: dados.disk_usage_gb[dados.disk_usage_gb.length - 1],
            uptime: dados.uptime_hours[dados.uptime_hours.length - 1]
        });

        const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));
        const cpu = dados.cpu_percent.map(item => item.valor);
        const memoria = dados.ram_percent.map(item => item.valor);
        const download = dados.net_download.map(item => (item.valor * 1024).toFixed(2));
        const upload = dados.net_upload.map(item => (item.valor * 1024).toFixed(2));
        const disco = dados.disk_percent.map(item => item.valor);

        atualizarGraficos({ cpu, memoria, download, upload, disco, timestamps });

    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
    }
}

function atualizarGraficos(dados) {
    console.log(dados)
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
    document.getElementById("cpuUptimeKPI").textContent = validarDado(dados.uptime.valor, "Sem dados");

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
        
        console.log("Processos adquiridos:", json);
    } catch (error) {
        console.error('Erro ao buscar processos:', error);
    }
}

inicializarGraficos();

if (id) {
    buscarMetricas(id);
    buscarThreshold(id);
    buscarProcessos(id);
    intervaloAtualizacao = setInterval(() => {
        buscarMetricas(id);
        buscarThreshold(id); 
        buscarProcessos(id);
    }, 5000);
}

// Botão de pesquisa manual
document.getElementById('confirm_button').addEventListener('click', async () => {
    const serialDigitado = document.querySelector('#select_modelo input').value;
    console.log(serialDigitado)

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
