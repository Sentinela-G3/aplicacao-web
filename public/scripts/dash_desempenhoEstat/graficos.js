if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
  alert("Sua sessão expirou! Logue-se novamente.");
  window.location.href = "../login.html";
}

let dadosS3 = [];
let modeloSelecionado = "";
let ctxsContent = [];
let modelos = [];

const sltModelo = document.getElementById("slt_modelo");
const sltPeriodo = document.getElementById("slt_periodo");
const kpisGerais = document.getElementById("desemp_geral");
const contGraficos = document.getElementById("graficos");

let periodoValue = Number(sltPeriodo.value);

sltPeriodo.addEventListener("change", () => {
  periodoValue = Number(sltPeriodo.value);
  atualizarGraf();
});

sltModelo.addEventListener("change", () => {
  modeloSelecionado = sltModelo.value;
  modelosComponentes(modeloSelecionado)
  atualizarGraf();
});

window.onload = async () => {
  const empresa = sessionStorage.getItem("idEmpresa");

  if (!empresa) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "../login.html";
    return;
  }

  const [modelosRetornados, dados] = await Promise.all([
    carregarModelos(empresa),
    carregarDadosS3(empresa)
  ]);

  
  modelos = modelosRetornados
  
  if (modelos.length === 0 || dados.length === 0) return;

  preencherSelectModelos(modelos);

  modeloSelecionado = modelos[0];
  dadosS3 = dados;

  atualizarGraf();
};

async function carregarModelos(empresa) {
  try {
    const response = await fetch(`/modelos/buscarModelos/${empresa}`);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error("Erro ao carregar modelos:", err);
    return [];
  }
}

async function modelosComponentes(idModelo) {
  try {
    const response = await fetch(`/modelos/modelosComponentes/${idModelo}`);
    const json = await response.json();
    preencherPagina(json)
  } catch (err) {
    console.error("Erro ao carregar modelos:", err);
  }
}

async function carregarDadosS3(empresa) {
  try {
    const response = await fetch(`/s3/${empresa}/4anos`);
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const blob = await response.blob();
    const texto = await blob.text();
    return JSON.parse(texto);
  } catch (err) {
    console.error("Erro ao buscar dados S3:", err);
    return [];
  }
}

function preencherSelectModelos(jsonModelo) {
  sltModelo.innerHTML = `<option value="#" disabled>Selecione o Modelo</option>`;
  let primeiro = true
  let modeloInicial = null
  jsonModelo.forEach(modelo => {
    const opt = document.createElement("option");
    if (primeiro) {
      primeiro = false
      opt.selected
      modeloInicial = modelo.id_modelo
    }
    opt.value = modelo.id_modelo;
    opt.textContent = modelo.nome;
    sltModelo.appendChild(opt);
  });
  if (jsonModelo.length > 0) {
    sltModelo.value = jsonModelo[0].id_modelo;
  }

  modelosComponentes(modeloInicial)
}

function preencherPagina(modelos) {
  kpisGerais.innerHTML = ""
  contGraficos.innerHTML = ""

  modelos.forEach(modelo => {
    kpisGerais.innerHTML += `<div class="kpi">
              <div class="kpiBox">
                <h3>${modelo.tipo}</h3>
                <div class="titulo">
                  <span>Eficiência (%)</span>
                </div>
                <div class="metrica">
                  <div class="valorMet" id="met_efi${modelo.tipo}">0</div>
                  <div class="metComparativa" id="ant_efi${modelo.tipo}">0</div>
                </div>
              </div>
              <div class="kpiBox">
                <div class="titulo">
                  <span>Sobrecarga (%)</span>
                </div>
                <div class="metrica">
                  <div class="valorMet" id="met_sobre${modelo.tipo}">0</div>
                  <div class="metComparativa" id="ant_sobre${modelo.tipo}">0</div>
                </div>
              </div>
            </div>`

    contGraficos.innerHTML += `<div class="container">
        <h3 id="comp_${modelo.tipo}">${modelo.modelo}</h3>
        <div class="desempenhoComponente">
          <div class="kpisComponente">
            <div class="kpiBox">
              <div class="titulo">
                <span>Média de Consumo(%)</span>
              </div>
              <div class="kpiContent">
                <div class="conjunto">
                  <div class="tipometrica"><span>Esperado</span></div>
                  <div class="metrica">
                    <div class="valorMet" id="met-esp_${modelo.tipo}">${modelo.minimo_esperado}</div>
                  </div>
                </div>
                <div class="conjunto">
                  <div class="tipometrica"><span>Atingido</span></div>
                  <div class="metrica">
                    <div class="valorMet" id="met-ati_${modelo.tipo}"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="kpiBox">
              <div class="titulo">
                <span>Média de Consumo Máximo(%)</span>
              </div>
              <div class="kpiContent">
                <div class="conjunto">
                  <div class="tipometrica"><span>Esperado</span></div>
                  <div class="metrica">
                    <div class="valorMet" id="met-esp-max_${modelo.tipo}">${modelo.maximo_esperado}</div>
                  </div>
                </div>
                <div class="conjunto">
                  <div class="tipometrica"><span>Atingido</span></div>
                  <div class="metrica">
                    <div class="valorMet" id="met-ati-max_${modelo.tipo}"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="grafDesempenho">
            <canvas id="graf_${modelo.tipo}"></canvas>
          </div>
        </div>
      </div>`
  });
}

function preencherSelectModelos(modelos) {
  sltModelo.innerHTML = `<option value="#" disabled>Selecione o Modelo</option>`;
  let primeiro = true
  let modeloInicial = null
  modelos.forEach(modelo => {
    const opt = document.createElement("option");
    if (primeiro) {
      primeiro = false
      opt.selected
      modeloInicial = modelo.id_modelo
    }
    opt.value = modelo.id_modelo;
    opt.textContent = modelo.nome;
    sltModelo.appendChild(opt);
  });
  if (modelos.length > 0) {
    sltModelo.value = modelos[0].id_modelo;
  }

  modelosComponentes(modeloInicial)
}

async function atualizarGraf() {
  if (!modeloSelecionado || dadosS3.length === 0) return;

  ctxsContent.forEach(grafico => grafico.destroy());
  ctxsContent = [];

  const periodoReal = Math.min(periodoValue, dadosS3.length);

  modelos.forEach(modelo => {
    const tipo = modelo.tipo;
    const canvas = document.getElementById(`graf_${tipo}`);

    if (!canvas) return;

    const dadosFiltrados = dadosS3
      .filter(item => item.modelo === modeloSelecionado && item.componente === tipo)
      .slice(0, periodoReal);

    const labels = dadosFiltrados.map(item => `${item.mes} ${item.ano}`);
    const dataValues = dadosFiltrados.map(item => Number(item.consumo));
    const dataMaximos = dadosFiltrados.map(item => Number(item.maximo));

    const tipoGraf = (periodoReal === 1) ? 'bar' : 'line';

    const chart = new Chart(canvas, {
      type: tipoGraf,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Consumo de Componente (%)',
            data: dataValues,
            borderColor: "rgb(74, 45, 245)",
            backgroundColor: "rgba(74, 45, 245, 0.5)",
            borderWidth: 2,
            tension: 0.05,
            pointStyle: false
          },
          {
            label: 'Consumo Máximo de Componente (%)',
            data: dataMaximos,
            borderColor: "rgb(254, 73, 78)",
            backgroundColor: "rgba(254, 73, 78, 0.5)",
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
            beginAtZero: true,
            title: {
              display: true,
              text: '% de uso'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: `${tipo} - ${modeloSelecionado}`
          }
        }
      }
    });

    ctxsContent.push(chart);
  });
}