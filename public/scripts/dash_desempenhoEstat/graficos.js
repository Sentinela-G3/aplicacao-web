if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
  alert("Sua sessão expirou! Logue-se novamente.");
  window.location.href = "../login.html";
}

let dadosS3 = [];
let modeloSelecionado = "";
let ctxsContent = [];
let modelos = [];
let componentes = [];
let ids = [];
let idsGraph = [];

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
});

window.onload = async () => {
  const empresa = sessionStorage.getItem("idEmpresa");
  const nomeEmpresa = sessionStorage.getItem("empresa");

  if (!empresa) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "../login.html";
    return;
  }

  const [modelosRetornados, dados] = await Promise.all([
    carregarModelos(empresa),
    carregarDadosS3(nomeEmpresa)
  ]);


  modelos = modelosRetornados

  if (modelos.length === 0 || dados.length === 0) return;

  preencherSelectModelos(modelos);

  modeloSelecionado = modelos[0];
  dadosS3 = dados;
};

async function carregarModelos(empresa) {
  try {
    const res = await fetch(`/maquinas/obterModelosMaquina/${empresa}`, { method: 'GET' });
    if (!res.ok) throw new Error("Erro na requisição");
    const json = await res.json();
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
    componentes = json
    console.log(json)
    preencherPagina()
  } catch (err) {
    console.error("Erro ao carregar modelos:", err);
  }
}

async function carregarDadosS3(nomeEmpresa) {
  try {
    if (!nomeEmpresa) throw new Error("nomeEmpresa não foi fornecido");

    let empresa = nomeEmpresa.replaceAll(" ", "-");
    const response = await fetch(`/bucket/dados/${empresa}`);

    if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Tipo de conteúdo não é JSON, forçando leitura como texto");
    }

    const blob = await response.blob();
    const texto = await blob.text();

    try {
      let json = JSON.parse(texto)
      console.log(json)
      return json;
    } catch (jsonErr) {
      console.error("Erro ao fazer parse do JSON:", jsonErr);
      throw new Error("Resposta não é JSON válido.");
    }

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

function preencherPagina() {
  kpisGerais.innerHTML = ""
  contGraficos.innerHTML = ""

  ids = []
  idsGraph = []

  componentes.forEach(modelo => {
    console.log(modelo)
    ids.push(`met_efi${modelo.tipo}`)
    ids.push(`ant_efi${modelo.tipo}`)
    ids.push(`met_sobre${modelo.tipo}`)
    ids.push(`ant_sobre${modelo.tipo}`)
    ids.push(`comp_${modelo.tipo}`)
    ids.push(`met-esp_${modelo.tipo}`)
    ids.push(`met-ati_${modelo.tipo}`)
    ids.push(`met-esp-max_${modelo.tipo}`)
    ids.push(`met-ati-max_${modelo.tipo}`)
    idsGraph.push(`graf_${modelo.tipo}`)
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
        <h3 id="comp_${modelo.tipo}">${modelo.tipo} ${modelo.modelo}</h3>
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
                    <div class="valorMet" id="met-esp_${modelo.tipo}">${modelo.minimo}</div>
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
                    <div class="valorMet" id="met-esp-max_${modelo.tipo}">${modelo.maximo}</div>
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

  atualizarGraf()
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

  let dados4anos = JSON.parse(JSON.stringify(dadosS3[0]));

  const periodoReal = Math.min(periodoValue, dadosS3[0].mediasMensais.length);

  const mapaMetricas = {
    "CPU": "cpu_percent",
    "Temperatura": "cpu_freq",
    "Memória RAM": "ram_percent",
    "Memória": "ram_percent",
    "RAM": "ram_percent",
    "Disco": "disk_percent",
    "RAM (GB)": "ram_usage_gb",
    "Disco (GB)": "disk_usage_gb",
    "Upload": "net_upload",
    "Download": "net_download",
    "Rede": "net_usage",
    "Uptime": "uptime_hours"
  };

  const eficienciasPeriodoAtual = [];
  const eficienciasPeriodoAnterior = [];

  componentes.forEach((componente, i) => {
    let canvas = document.getElementById(idsGraph[i]);
    let labels = [];
    let dataValues = [];
    let dataMaximos = [];
    let tipoGraf = 'line';

    const metricasPermitidas = [
      "cpu_percent",
      "ram_percent",
      "disk_percent",
      "net_usage",
      "uptime_hours"
    ];

    let mediasFiltradas = dados4anos.mediasMensais.filter(dado =>
      metricasPermitidas.includes(dado.metrica)
    );

    let metricaSelecionada = idsGraph[i].split("_").slice(1).join("_");
    const metricaInterna = mapaMetricas[metricaSelecionada];

    if (!metricasPermitidas.includes(metricaInterna)) {
      console.log(`Pulando componente ${componente.tipo} pois métrica ${metricaInterna} não permitida.`);
      return;
    }

    let dadosFiltrados = mediasFiltradas.filter(dado => dado.metrica === metricaInterna);

    if (dadosFiltrados.length === 0) {
      console.log(`Sem dados para a métrica ${metricaInterna}, pulando componente ${componente.tipo}.`);
      return;
    }

    let periodoRealUsado = Math.min(periodoReal, dadosFiltrados.length);

    if (periodoRealUsado === 1) {
      tipoGraf = 'bar';
      let ultimoIndice = dadosFiltrados.length - 1;
      if (dadosFiltrados[ultimoIndice]?.data) {
        labels.push(dadosFiltrados[ultimoIndice].data);
        dataValues.push(dadosFiltrados[ultimoIndice].mediaGeral);
        dataMaximos.push(dadosFiltrados[ultimoIndice].mediaPico);
      }
    } else {
      for (let j = 0; j < periodoRealUsado; j++) {
        if (dadosFiltrados[j]?.data) {
          labels.push(dadosFiltrados[j].data);
          dataValues.push(dadosFiltrados[j].mediaGeral);
          dataMaximos.push(dadosFiltrados[j].mediaPico);
        } else {
          console.warn(`Dado sem data na posição ${j} para métrica ${metricaInterna}`);
        }
      }
    }

    if (dataValues.length > 0 && dataMaximos.length > 0) {
      const mediaGeralPeriodo = dataValues.reduce((a, b) => a + b, 0) / dataValues.length;
      const mediaPicoPeriodo = dataMaximos.reduce((a, b) => a + b, 0) / dataMaximos.length;

      const elemAti = document.getElementById(`met-ati_${componente.tipo}`);
      const elemAtiMax = document.getElementById(`met-ati-max_${componente.tipo}`);
      if (elemAti) elemAti.textContent = mediaGeralPeriodo.toFixed(2);
      if (elemAtiMax) elemAtiMax.textContent = mediaPicoPeriodo.toFixed(2);

      const dadosPeriodo = dadosFiltrados.slice(0, periodoRealUsado);
      const totalUptime = dadosPeriodo.reduce((acc, cur) => acc + (cur.uptimeTotal || 0), 0);
      const uptimePico = dadosPeriodo.reduce((acc, cur) => acc + (cur.uptimePico || 0), 0);
      const contagemAcima95 = dadosPeriodo.reduce((acc, cur) => acc + (cur.contadorAcima95 || 0), 0);

      const eficiencia = totalUptime > 0 ? ((totalUptime - uptimePico) / totalUptime) * 100 : 0;
      const sobrecarga = totalUptime > 0 ? (contagemAcima95 / totalUptime) * 100 : 0;

      const elemEfi = document.getElementById(`met_efi${componente.tipo}`);
      const elemSobre = document.getElementById(`met_sobre${componente.tipo}`);
      if (elemEfi) elemEfi.textContent = eficiencia.toFixed(2);
      if (elemSobre) elemSobre.textContent = sobrecarga.toFixed(2);

      eficienciasPeriodoAtual.push(eficiencia);

      if (dadosFiltrados.length >= periodoRealUsado * 2) {
        const periodoAnterior = dadosFiltrados.slice(periodoRealUsado, periodoRealUsado * 2);
        const totalUptimeAnt = periodoAnterior.reduce((acc, cur) => acc + (cur.uptimeTotal || 0), 0);
        const uptimePicoAnt = periodoAnterior.reduce((acc, cur) => acc + (cur.uptimePico || 0), 0);
        const contagemAcima95Ant = periodoAnterior.reduce((acc, cur) => acc + (cur.contadorAcima95 || 0), 0);

        const eficienciaAnt = totalUptimeAnt > 0 ? ((totalUptimeAnt - uptimePicoAnt) / totalUptimeAnt) * 100 : 0;
        const sobrecargaAnt = totalUptimeAnt > 0 ? (contagemAcima95Ant / totalUptimeAnt) * 100 : 0;

        eficienciasPeriodoAnterior.push(eficienciaAnt);

        const diffEfi = eficiencia - eficienciaAnt;
        const diffSobre = sobrecarga - sobrecargaAnt;

        const elemAntEfi = document.getElementById(`ant_efi${componente.tipo}`);
        const elemAntSobre = document.getElementById(`ant_sobre${componente.tipo}`);

        if (elemAntEfi) {
          const prefixo = diffEfi >= 0 ? "+" : "";
          elemAntEfi.textContent = `${prefixo}${diffEfi.toFixed(2)}%`;
          elemAntEfi.classList.toggle("valor-positivo", diffEfi >= 0);
          elemAntEfi.classList.toggle("valor-negativo", diffEfi < 0);
        }

        if (elemAntSobre) {
          const prefixo = diffSobre >= 0 ? "+" : "";
          elemAntSobre.textContent = `${prefixo}${diffSobre.toFixed(2)}%`;
          elemAntSobre.classList.toggle("valor-negativo", diffSobre >= 0);
          elemAntSobre.classList.toggle("valor-positivo", diffSobre < 0);
        }
      } else {
        const elemAntEfi = document.getElementById(`ant_efi${componente.tipo}`);
        const elemAntSobre = document.getElementById(`ant_sobre${componente.tipo}`);
        if (elemAntEfi) elemAntEfi.textContent = "";
        if (elemAntSobre) elemAntSobre.textContent = "";
      }
    } else {
      const idsLimpar = [`met-ati_${componente.tipo}`, `met-ati-max_${componente.tipo}`, `met_efi${componente.tipo}`, `met_sobre${componente.tipo}`];
      idsLimpar.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = "0";
      });
      const idsLimparAnt = [`ant_efi${componente.tipo}`, `ant_sobre${componente.tipo}`];
      idsLimparAnt.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = "";
      });
    }

    if (labels.length === 0) {
      console.log(`Nenhuma label válida para o componente ${componente.tipo}, pulando gráfico.`);
      return;
    }

    const chart = new Chart(canvas, {
      type: tipoGraf,
      data: {
        labels: labels,
        datasets: [{
          label: 'Consumo de Componente (%)',
          data: dataValues,
          borderColor: "rgb(74, 45, 245)",
          backgroundColor: "rgba(74, 45, 245, 0.5)",
          borderWidth: 2,
          tension: 0.05,
          pointStyle: false
        }, {
          label: 'Consumo Máximo de Componente (%)',
          data: dataMaximos,
          borderColor: "rgb(254, 73, 78)",
          backgroundColor: "rgba(254, 73, 78, 0.5)",
          borderWidth: 2,
          tension: 0.05,
          pointStyle: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, title: { display: true, text: '% de uso' } } },
        plugins: { legend: { position: 'top' }, title: { display: true, text: `${componente.tipo}` } }
      }
    });

    ctxsContent.push(chart);
  }); // Fim do loop forEach

  // ESTE É O LOCAL CORRETO para calcular a eficiência média do modelo, após o loop
  if (eficienciasPeriodoAtual.length > 0) {
    const mediaEficienciaAtual = eficienciasPeriodoAtual.reduce((a, b) => a + b, 0) / eficienciasPeriodoAtual.length;
    const elemEfiMod = document.getElementById("met_efiMod");
    if (elemEfiMod) elemEfiMod.textContent = mediaEficienciaAtual.toFixed(2);

    if (eficienciasPeriodoAnterior.length === eficienciasPeriodoAtual.length) {
      const mediaEficienciaAnterior = eficienciasPeriodoAnterior.reduce((a, b) => a + b, 0) / eficienciasPeriodoAnterior.length;
      const diff = mediaEficienciaAtual - mediaEficienciaAnterior;
      const prefixo = diff >= 0 ? "+" : "";
      const elemAntEfiMod = document.getElementById("ant_efiMod");
      if (elemAntEfiMod) elemAntEfiMod.textContent = `${prefixo}${diff.toFixed(2)}%`;
    } else {
      const elemAntEfiMod = document.getElementById("ant_efiMod");
      if (elemAntEfiMod) elemAntEfiMod.textContent = "";
    }
  } else {
    const elemEfiMod = document.getElementById("met_efiMod");
    const elemAntEfiMod = document.getElementById("ant_efiMod");
    if (elemEfiMod) elemEfiMod.textContent = "0";
    if (elemAntEfiMod) elemAntEfiMod.textContent = "";
  }
}