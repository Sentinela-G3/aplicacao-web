const ctx_CPU = document.getElementById('graf_CPU');
const ctx_RAM = document.getElementById('graf_RAM');
const ctx_Rede = document.getElementById('graf_Rede');
const ctx_Bateria = document.getElementById('graf_Bateria');
const ctx_Disco = document.getElementById('graf_Disco');

let ctxs = [ctx_CPU, ctx_RAM, ctx_Bateria, ctx_Rede, ctx_Disco]
let ctxsContent = []
let periodoSlt = document.getElementById("slt_periodo")
let periodoValue = Number(periodoSlt.value)
let cLine = null

let dataValues = []
let dataValues1 = []

let labels = ['Jan 24', 'Fev 24', 'Mar 24', 'Abr 24', 'Mai 24', 'Jun 24', 'Jul 24', 'Ago 24', 'Set 24', 'Out 24', 'Nov 24', 'Dez 24', 'Jan 25', 'Fev 25', 'Mar 25', 'Abr 25', 'Mai 25', 'Jun 25', 'Jul 25', 'Ago 25', 'Set 25', 'Out 25', 'Nov 25', 'Dez 25']

atualizarGraf()

periodoSlt.addEventListener("change", () => {
  periodoValue = Number(slt_periodo.value);
  atualizarGraf()
});

function atualizarGraf() {
  ctxsContent.forEach(grafico => grafico.destroy());
  ctxsContent = [];

  let periodoReal = periodoValue

  if (periodoValue < dataValues.length) {
    periodoReal = dataValues.length
  }

  let chartType = (periodoReal === 1) ? 'bar' : 'line';

  for (let i = 0; i < ctxs.length; i++) {
    let dataValues = [];
    let dataValues1 = [];

    for (let j = 0; j < periodoReal; j++) {
      dataValues.push(Math.round(Math.random() * 5 + 1));
      dataValues1.push(Math.round(Math.random() * 5 + 6));
    }

    let chart = new Chart(ctxs[i], {
      type: chartType,
      data: {
        labels: labels.slice(0, periodoReal),
        datasets: [
          {
            label: 'Consumo de Componente(%)',
            data: dataValues,
            borderColor: "rgb(74, 45, 245)",
            backgroundColor: "rgb(74, 45, 245)",
            borderWidth: 2,
            tension: 0.05,
            pointStyle: false
          },
          {
            label: 'Consumo Máximo de Componente(%)',
            data: dataValues1,
            borderColor: "rgb(254, 73, 78)",
            backgroundColor: "rgb(254, 73, 78)",
            borderWidth: 2,
            tension: 0.05,
            pointStyle: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    ctxsContent.push(chart);
  }
}