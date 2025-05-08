// Função para pegar o ID da URL
const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

const BASE_URL = window.location.hostname === "localhost"
  ? "localhost:3333"
  : "18.208.5.45:3333";

// Criar os gráficos já vazios
let graficoDeEfetividadeRobos;
let intervaloAtualizacao;

function inicializarGraficos() {
    const hoje = new Date();
    const categorias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - (6 - i));
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const dadosEfetividade = Array.from({ length: 7 }, () => Math.floor(Math.random() * 56) + 40);

    const graficoDeEfetividadeRobos = new ApexCharts(document.querySelector("#chart-efetividade-robos"), {
        series: [{
            name: "Efetividade",
            data: dadosEfetividade,
            color: '#e2d04a',
            fill: {
                type: 'solid',
                opacity: 0.5,
                gradient: {
                    shade: 'light',
                    type: 'vertical',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#FFEB3B'],
                    stops: [0, 100]
                }
            }
        }],
        chart: {
            type: 'area',
            height: '85%',
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        grid: {
            padding: {
                top: -20,  
                bottom: -10
            }
        },
        xaxis: {
            categories: categorias,
            title: {
                text: 'Data',
                offsetY: -10, 
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            },
            labels: {
                rotate: -45,
                style: { fontSize: '12px' }
            }
        },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 10,
            title: {
                text: 'Efetividade (%)',
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            }
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#e2d04a'] 
            },
            background: {
                enabled: true,
                foreColor: '#000',
                borderRadius: 100, 
                borderWidth: 1,
                borderColor: '#ffe628',
                opacity: 1,
                padding: 4,
            }
        }
    });

    graficoDeEfetividadeRobos.render();
}


// Atualiza apenas os gráficos
function atualizarGraficos(dados) {
    graficoDeEfetividadeRobos.updateOptions({
        xaxis: { categories: dados.timestamps }
    });
    graficoDeEfetividadeRobos.updateSeries([{ name: "CPU %", data: dados.cpu }]);
    graficoDeEfetividadeRobos.update();
}

function converterHorasParaTexto(horasFloat) {
    const horas = Math.floor(horasFloat);
    const minutos = Math.round((horasFloat - horas) * 60);
    
    return `${horas} hora${horas !== 1 ? 's' : ''} e ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
}

// Atualiza os dados dos boxes
function atualizarBoxes(dados) {

    // CPU
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[0].textContent = `${dados.cpu_freq} GHz`;
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[1].textContent = `${dados.cpu_percent}%`;
    document.querySelectorAll(".graficos_align")[0].querySelectorAll(".data-box .data")[2].textContent = `${converterHorasParaTexto(dados.uptime.valor)}`;
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
        });

        // Transformar os dados para atualizar os gráficos
        const timestamps = dados.cpu_percent.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false }));

        const cpu = dados.cpu_percent.map(item => item.valor);
        atualizarGraficos({ cpu});

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

