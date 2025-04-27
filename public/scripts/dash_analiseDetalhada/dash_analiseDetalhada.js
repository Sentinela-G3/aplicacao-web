// Função para pegar o ID da URL
const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

const BASE_URL = window.location.hostname === "localhost"
  ? "localhost:3333"
  : "18.208.5.45:3333";



// Criar os gráficos já vazios
let chartCPU, chartMemoria, chartRede, chartDisco;
let intervaloAtualizacao;

function inicializarGraficos() {
    chartCPU = new ApexCharts(document.querySelector("#chart"), {
        series: [{ name: "CPU %", data: [] }],
        chart: { type: 'line', height: 350 },
        xaxis: { categories: [] }
    });
    chartCPU.render();

    chartMemoria = new ApexCharts(document.querySelector("#chart2"), {
        series: [{ name: "Memória %", data: [] }],
        chart: { type: 'line', height: 350 },
        xaxis: { categories: [] }
    });
    chartMemoria.render();

    chartRede = new ApexCharts(document.querySelector("#chart4"), {
        series: [{ name: "Rede (Upload MB)", data: [] }],
        chart: { type: 'line', height: 350 },
        xaxis: { categories: [] }
    });
    chartRede.render();

    chartDisco = new ApexCharts(document.querySelector("#chart6"), {
        series: [{ name: "Disco %", data: [] }],
        chart: { type: 'line', height: 350 },
        xaxis: { categories: [] }
    });
    chartDisco.render();
}

// Atualiza apenas os gráficos
function atualizarGraficos(dados) {
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

    chartRede.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartRede.updateSeries([{ name: "Upload MB", data: dados.rede }]);
    chartRede.update();

    chartDisco.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    chartDisco.updateSeries([{ name: "Disco %", data: dados.disco }]);
    chartDisco.update();
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

// Atualiza os dados dos boxes
function atualizarBoxes(dados) {

    // CPU
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[0].textContent = `${dados.cpu_freq} GHz`;
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[1].textContent = `${dados.cpu_percent}%`;
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[2].textContent = `${converterHorasParaTexto(dados.uptime.valor)}`;

    // Memória
    document.querySelectorAll(".graficos_align")[1].querySelectorAll(".data-box .data")[0].textContent = `${(dados.ram_used[dados.ram_used.length - 1].valor).toFixed(2)} GB de ${calcularTotalRAM(dados.ram_used[0].valor, dados.ram_percent)} GB`;
    document.querySelectorAll(".graficos_align")[1].querySelectorAll(".data-box .data")[1].textContent = `${dados.ram_percent}%`;

    // Rede
    document.querySelectorAll(".graficos_align")[2].querySelectorAll(".data-box .data")[0].textContent = `${dados.net_download.toFixed(6)} mbps`;
    document.querySelectorAll(".graficos_align")[2].querySelectorAll(".data-box .data")[1].textContent = `${dados.net_upload.toFixed(6)} mbps`;

    // Disco
    document.querySelectorAll(".graficos_align")[3].querySelectorAll(".data-box .data")[0].textContent = `${calcularCapacidadeDisco(dados.disk_used_gb.valor, dados.disk_usage.valor).capacidadeLivre} GB`;
    document.querySelectorAll(".graficos_align")[3].querySelectorAll(".data-box .data")[1].textContent = `${dados.disk_used_gb.valor.toFixed(2)} GB`;
    document.querySelectorAll(".graficos_align")[3].querySelectorAll(".data-box .data")[2].textContent = `${calcularCapacidadeDisco(dados.disk_used_gb.valor, dados.disk_usage.valor).capacidadeTotal} GB`;
}

// Função para buscar dados da máquina
async function buscarMetricas(idMaquina) {
    try {
        const response = await fetch(`http://${BASE_URL}/medidas/${idMaquina}`);
        const json = await response.json();
        const dados = json.dados;


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

        // Transformar os dados para atualizar os gráficos
        const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));

        const cpu = dados.cpu_percent.map(item => item.valor);
        const memoria = dados.ram_percent.map(item => item.valor);
        const rede = dados.net_upload.map(item => (item.valor * 1024).toFixed(2));
        const disco = dados.disk_percent.map(item => item.valor);

        atualizarGraficos({ cpu, memoria, rede, disco, timestamps });

    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
    }
}

// Inicialização
inicializarGraficos();

// Atualizar a cada 5 segundos
if (id) {
    buscarMetricas(id);
    intervaloAtualizacao = setInterval(() => {
        buscarMetricas(id);
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

            console.log(dadosSerial)

            // Atualiza o ID e para o intervalo anterior
            clearInterval(intervaloAtualizacao);

            id = idMaquina;
            buscarMetricas(id);

            // Atualizar a cada 5 segundos para o novo ID
            intervaloAtualizacao = setInterval(() => {
                buscarMetricas(id);
            }, 5000);

        } catch (error) {
            console.error('Erro ao buscar ID pelo serial:', error);
        }
    }
});
