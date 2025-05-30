// if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
//   alert("Sua sessão expirou! Logue-se novamente.");
//   window.location.href = "../login.html";
// }

window.onload = atualizarGraf();

const bucketRoutes = require("/src/routes/bucket");
app.use("/bucket", bucketRoutes);

const ctx_CPU = document.getElementById('graf_CPU');
const ctx_RAM = document.getElementById('graf_RAM');
const ctx_Rede = document.getElementById('graf_Rede');
const ctx_Bateria = document.getElementById('graf_Bateria');
const ctx_Disco = document.getElementById('graf_Disco');

let ctxs = [ctx_CPU, ctx_RAM, ctx_Bateria, ctx_Rede, ctx_Disco]
let ctxsContent = []
let periodoSlt = document.getElementById("slt_periodo")
let periodoValue = Number(periodoSlt.value)

periodoSlt.addEventListener("change", () => {
  periodoValue = Number(slt_periodo.value);
  atualizarGraf()
});

async function atualizarGraf() {
  ctxsContent.forEach(grafico => grafico.destroy());
  ctxsContent = [];

  let periodoReal = periodoValue

  if (periodoValue < dadosS3.length) {
    periodoReal = dadosS3.length
  }

  const response = await fetch("/bucket/dados-componente");
  const dadosS3 = await response.json();

  const modeloSelecionado = "Modelo A";
  const nomeComponentes = ["CPU", "RAM", "Bateria", "Rede", "Disco"];

  for (let i = 0; i < ctxs.length; i++) {
    const nomeComp = nomeComponentes[i];

    const dadosComp = dadosS3
      .filter(item => item.modelo === modeloSelecionado && item.componente === nomeComp)
      .slice(0, periodoReal); // limita ao período desejado

    const labels = dadosComp.map(item => `${item.mes} ${item.ano}`);
    const dataValues = dadosComp.map(item => Number(item.consumo));
    const dataValues1 = dadosComp.map(item => Number(item.maximo));

    let tipoGraf = (periodoReal === 1) ? 'bar' : 'line';

    for (let i = 0; i < ctxs.length; i++) {
      let chart = new Chart(ctxs[i], {
        type: tipoGraf,
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
}