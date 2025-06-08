if (
    !sessionStorage.idEmpresa ||
    !sessionStorage.idUsuario ||
    !sessionStorage.email ||
    !sessionStorage.tipoUsuario ||
    !sessionStorage.nomeUsuario
) {
    alert("Sua sessão expirou! Logue-se novamente.");
    window.location.href = "../login.html";
}

const BASE_URL =
    window.location.hostname === "localhost" ?
        "localhost:3333" :
        "54.146.110.146:3333";

const usuario = {
    idEmpresa: sessionStorage.idEmpresa,
    idUsuario: sessionStorage.idUsuario,
    email: sessionStorage.email,
    tipoUsuario: sessionStorage.tipoUsuario,
    nomeUsuario: sessionStorage.nomeUsuario,
};

async function carregarMaquinas() {
    try {
        const { machines, alerts } = await buscarMaquina();

        kpiUltimoAlerta(machines, alerts);
        kpiMaisAlertas(machines, alerts);

        const machinesOrdenadas = ordenarLista(machines, alerts);

        await exibirMaquinas(machinesOrdenadas, alerts);

    } catch (error) {
        console.error("Erro no processo de carregamento das máquinas:", error);
    }
}

async function buscarMaquina() {
    try {
        const [machinesResponse, alertsResponse] = await Promise.all([
            fetch(`http://${BASE_URL}/maquinas/${usuario.idEmpresa}`),
            fetch(`http://${BASE_URL}/jira/tickets`),
        ]);

        if (!machinesResponse.ok) throw new Error("Erro ao buscar dados das máquinas");
        if (!alertsResponse.ok) throw new Error("Erro ao buscar dados de alertas");

        const [machines, alertsData] = await Promise.all([
            machinesResponse.json(),
            alertsResponse.json(),
        ]);

        const allAlerts = (Array.isArray(alertsData) ? alertsData : []).filter(
            (ticket) => ticket && String(ticket.requestTypeId) === "5"
        );

        return {
            alerts: allAlerts,
            machines: machines
        };

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        return { alerts: [], machines: [] };
    }
}

function kpiUltimoAlerta(machines, alerts) {
    try {
        if (!Array.isArray(alerts) || alerts.length === 0) {
            console.warn("Nenhum alerta disponível para a KPI.");
            return;
        }
        const alertasOrdenados = alerts.sort((a, b) => b.createdDate.epochMillis - a.createdDate.epochMillis);
        const ultimoAlerta = alertasOrdenados[0];
        const serialProcurado = ultimoAlerta.summary ? ultimoAlerta.summary.replace("Máquina ", "") : "";
        const tempoDecorridoMs = Date.now() - ultimoAlerta.createdDate.epochMillis;
        const minutos = Math.floor(tempoDecorridoMs / 60000);
        const recurso = ultimoAlerta.requestFieldValues.find(f => f.fieldId === "customfield_10058")?.value?.value || "";
        const urgenciaField = ultimoAlerta.requestFieldValues?.find(f => f.fieldId === "customfield_10059");
        const nivel = urgenciaField?.value?.value;
        const iconeAlertaT = document.getElementById('icone-alerta');
        const alertaDetalhe = document.getElementById('alerta-detalhes');

        if (nivel === "Leve") {
            iconeAlertaT.style.color = "var(--color-alerta-amarelo-escuro)";
            alertaDetalhe.style.backgroundColor = "var(--color-alerta-amarelo-escuro)";
            alertaDetalhe.style.color = "#fff";
        } if (nivel === "Grave") {
            iconeAlertaT.style.color = "var(--color-alerta-laranja)";
            alertaDetalhe.style.backgroundColor = "var(--color-alerta-laranja)";
            alertaDetalhe.style.color = "#fff";
        } if (nivel === "Crítico") {
            iconeAlertaT.style.color = "var(--color-alerta-vermelho)";
            alertaDetalhe.style.backgroundColor = "var(--color-alerta-vermelho)";
            alertaDetalhe.style.color = "#fff";

        }

        const ultimaMaquina = machines.find(maquinas => maquinas.serial_number === serialProcurado);

        if (ultimaMaquina) {
            const idMaquina = ultimaMaquina.id_maquina;

            const card = document.getElementById("ultimo-alerta-kpi");
            card.onclick = () => analiseDetalhada(idMaquina);
            card.style.cursor = "pointer";
        }

        document.getElementById("alerta-recurso").textContent = `Alerta ${nivel} de ${recurso}`;
        document.getElementById("alerta-detalhes").textContent = `${serialProcurado} • há ${minutos} min`;

    } catch (erro) {
        console.error("Erro ao processar KPI do último alerta:", erro);
    }
}

function kpiMaisAlertas(machines, alerts) {
    try {
        if (!Array.isArray(alerts) || alerts.length === 0) {
            console.warn("Nenhum alerta disponível para a KPI.");
            return;
        }
        const seriais = [];

        alerts.forEach(alerta => {
            let numeroSerial = null;

            if (alerta.summary) {
                const partes = alerta.summary.split(' ');
                numeroSerial = partes[parts.length - 1];
                seriais.push(numeroSerial);
            }

        });

        const contagem = new Map();
        seriais.forEach(serial => {
            contagem.set(serial, (contagem.get(serial) || 0) + 1);
        });

        let maquinaMaisAlerts = null;
        let maxAlertas = 0;

        for (const [serial, qtd] of contagem.entries()) {
            if (qtd > maxAlertas) {
                maxAlertas = qtd;
                maquinaMaisAlerts = serial;
            }
        }

        const frase = maxAlertas === 1 ? "Alerta Registrado" : "Alertas Registrados";
        const iconeAlerta = document.getElementById('icone-mais-alertas');
        const alertaDetalhes = document.getElementById('texto-mais-alertas');

        if (maxAlertas > 0) {
            iconeAlerta.style.color = "var(--color-alerta-vermelho)";
            alertaDetalhes.style.backgroundColor = "var(--color-alerta-vermelho)";
            alertaDetalhes.style.color = "#fff";
        }
        const ultimaMaquina = machines.find(maquinas => maquinas.serial_number === maquinaMaisAlerts);

        if (ultimaMaquina) {
            const idMaquina = ultimaMaquina.id_maquina;

            const card = document.getElementById("kpi-mais-alertas");
            card.onclick = () => analiseDetalhada(idMaquina);
            card.style.cursor = "pointer";
        }

        document.querySelector("#kpi-mais-alertas .kpi-value").textContent = maquinaMaisAlerts;
        document.querySelector("#kpi-mais-alertas .kpi-subtitle").textContent = `${maxAlertas} ${frase}`;

    } catch (erro) {
        console.error("Erro ao processar KPI de máquina com mais alertas:", erro);
    }
}

function ordenarLista(machines, alerts) {
    return machines.sort((a, b) => {
        const aSerial = a.serial_number;
        const bSerial = b.serial_number;

        const alertasA = alerts
            .filter(ticket => ticket.summary?.includes(aSerial) || ticket.issueKey?.includes(aSerial))
            .reduce((total, ticket) => {
                const urgenciaField = ticket.requestFieldValues?.find(f => f.fieldId === "customfield_10059");
                const nivel = urgenciaField?.value?.value;

                if (nivel === "Leve") return total + 1;
                if (nivel === "Grave") return total + 2;
                if (nivel === "Crítico") return total + 3;
                return total;
            }, 0);

        const alertasB = alerts
            .filter(ticket => ticket.summary?.includes(bSerial) || ticket.issueKey?.includes(bSerial))
            .reduce((total, ticket) => {
                const urgenciaField = ticket.requestFieldValues?.find(f => f.fieldId === "customfield_10059");
                const nivel = urgenciaField?.value?.value;

                if (nivel === "Leve") return total + 1;
                if (nivel === "Grave") return total + 2;
                if (nivel === "Crítico") return total + 3;
                return total;
            }, 0);

        return alertasB - alertasA;
    });
}

async function buscarMetricas(idMaquina) {
    const res = await fetch(`http://${BASE_URL}/medidas/${idMaquina}`);
    return res.ok ? await res.json() : {};
}

function calcularStatus(metrics) {
    const temDados = metrics.dados && !Array.isArray(metrics.dados);
    if (!temDados) return { statusText: "Inativo", statusColor: "gray", segundos: null };

    for (const tipo in metrics.dados) {
        const dadosTipo = metrics.dados[tipo];
        if (dadosTipo?.length > 0) {
            const captura = new Date(dadosTipo[dadosTipo.length - 1].timestamp);
            const agora = new Date();
            const segundos = (agora - captura) / 1000;

            if (segundos <= 15) return { statusText: "Ativo", statusColor: "#4caf50", segundos };
            else return {
                statusText: `Inativo (${captura.toLocaleString("pt-BR")})`,
                statusColor: "#d32f2f",
                segundos
            };
        }
    }

    return { statusText: "Inativo", statusColor: "gray", segundos: null };
}

function calcularAlertas(machine, alerts) {
    const serial = machine.serial_number;
    return alerts.filter(ticket =>
        ticket.summary?.includes(serial) || ticket.issueKey?.includes(serial)
    );
}

function extrairUltimoAlerta(alertasMaquina) {
    const alertaMaisRecente = alertasMaquina.reduce((maisRecente, alerta) => {
        const alertaData = alerta.createdDate?.iso8601 ? new Date(alerta.createdDate.iso8601) : null;
        if (!alertaData) return maisRecente;
        if (!maisRecente) return alerta;
        const maisRecenteData = new Date(maisRecente.createdDate.iso8601);
        return alertaData > maisRecenteData ? alerta : maisRecente;
    }, null);

    if (!alertaMaisRecente) return;

    const ultimaData = new Date(alertaMaisRecente.createdDate.iso8601);
    const tempoDecorridoMs = Date.now() - ultimaData;
    const minutos = Math.floor(tempoDecorridoMs / 60000);

    const urgenciaField = alertaMaisRecente.requestFieldValues?.find(f => f.fieldId === "customfield_10059");
    const nivel = urgenciaField?.value?.value;

    let cor;
    if (nivel === "Leve") {
        cor = "#f2c94c";
    } else if (nivel === "Grave") {
        cor = "#f57c00";
    } else if (nivel === "Crítico") {
        cor = "#d32f2f";
    } else {
        cor = "gray";
    }

    return alertasMaquina.length > 0 ?
        ` <a href="${alertasMaquina[0]._links?.web || "#"}"
            target="_blank"
            title="Clique para abrir o chamado no Jira"
            style="text-decoration: none; color: ${cor};">
            ${`há ${minutos} min` || "N/A"} 🔗
            </a>
            ` : `Nenhum`;
}

function getValor(metrics, tipo) {
    if (!metrics.dados?.[tipo] || metrics.dados[tipo].length === 0) return null;
    const latest = metrics.dados[tipo][metrics.dados[tipo].length - 1];
    return latest?.valor ?? null;
}

function criarOuAtualizarLinha(tableBody, rowMap, machine, status, metrics, alertas, linkUltimoAlerta) {
    const id = `machine-${machine.id_maquina}`;
    const setor = machine.setor;
    const uptime = getValor(metrics, "uptime_hours");
    const ram = getValor(metrics, "ram_percent");
    const cpu = getValor(metrics, "cpu_percent");
    const disco = getValor(metrics, "disk_percent");
    const bateria = getValor(metrics, "battery_percent");
    const netDownload = getValor(metrics, "net_download");
    const netUpload = getValor(metrics, "net_upload");

    const downloadMbps = netDownload !== null ? netDownload * 8 * 1024 : null;
    const uploadMbps = netUpload !== null ? netUpload * 8 * 1024 : null;

    let row = rowMap.get(id);
    const data = {
        status: { text: status.statusText, color: status.statusColor },
        uptime: uptime !== null ? formatarHoras(uptime) : "-",
        alertasCount: alertas.length,
        ultimoAlerta: linkUltimoAlerta,
        ram: ram !== null ? Math.round(ram) : "-",
        cpu: cpu !== null ? Math.round(cpu) : "-",
        disco: disco !== null ? Math.round(disco) : "-",
        bateria,
        downloadMbps: downloadMbps !== null ? downloadMbps.toFixed(2) : "-",
        uploadMbps: uploadMbps !== null ? uploadMbps.toFixed(2) : "-"
    };

    if (row) {
        updateTableRow(row, data);
        rowMap.delete(id);
    } else {
        row = document.createElement("tr");
        row.setAttribute("data-machine-id", id);
        row.innerHTML = `
            <td style="background-color: ${status.statusColor};"></td>

            <td title="Máquina: Serial e Setor">
            <span style="font-weight: bold; color: ${status.statusColor};">${machine.serial_number}</span><br>
            <small style="color: ${status.statusColor};">${setor}</small>
            </td>

            <td class="status" title="Status da máquina">
            ${status.statusText}
            </td>
            <td class="uptime" title="Tempo Ativo">${data.uptime}</td>
            <td class="cpu" title="Uso de CPU (%)">${data.cpu}</td>
            <td class="ram" title="Uso de RAM (%)">${data.ram}</td>
            <td class="disco" title="Uso de Disco (%)">${data.disco}</td>
            <td class="download" title="Taxa de Download (Mbps)">${data.downloadMbps}</td>
            <td class="upload" title="Taxa de Upload (Mbps)">${data.uploadMbps}</td>
            <td class="bateria" title="Nível de Bateria (%)">${data.bateria ?? "-"}</td>
            <td class="ultimo-alerta">${data.ultimoAlerta}</td>
            <td class="alertas-count" title="Total de Alertas">${data.alertasCount}</td>

            <td>
            <button class="details-btn" onclick="analiseDetalhada(${machine.id_maquina})" data-id="${machine.id_maquina}" title="Ver detalhes da máquina">
                Expandir Análise
            </button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    return { uptime, row };
}

function kpiStatusMauquinas({ ativas, inativas, semDados, total, totalAlertas }) {
    document.querySelector(".kpi-stack .kpi-mini:nth-child(1) .value").textContent = total;
    document.querySelector(".kpi-stack .kpi-mini.active .value").textContent = ativas;
    document.querySelector(".kpi-stack .kpi-mini.inactive .value").textContent = inativas;

    const kpiAtivas = document.querySelectorAll(".kpi_maqRT2 span:nth-child(2)")[0];
    const kpiInativas = document.querySelectorAll(".kpi_maqRT2 span:nth-child(2)")[1];

    if (kpiAtivas) kpiAtivas.textContent = ativas;
    if (kpiInativas) kpiInativas.textContent = `${inativas} (${semDados} sem dados)`;

    const qtdAlertas = document.getElementById("qtd_alertas");
    if (qtdAlertas) qtdAlertas.textContent = totalAlertas;
}

async function exibirMaquinas(machines, alerts) {
    let maiorTempo = 0;
    let maiorTempoMaquina = null;
    const tableBody = document.querySelector(".table_body");

    const existingRows = new Map();
    tableBody.querySelectorAll("tr").forEach(row => {
        const id = row.getAttribute("data-machine-id");
        if (id) existingRows.set(id, row);
    });

    let ativas = 0, inativas = 0, semDados = 0, totalAlertas = 0;

    for (const machine of machines) {
        const metrics = await buscarMetricas(machine.id_maquina);
        const status = calcularStatus(metrics);
        const alertasMaquina = calcularAlertas(machine, alerts);
        const linkUltimoAlerta = extrairUltimoAlerta(alertasMaquina);

        const { uptime } = criarOuAtualizarLinha(tableBody, existingRows, machine, status, metrics, alertasMaquina, linkUltimoAlerta);

        if (uptime !== null && uptime > maiorTempo) {
            maiorTempo = uptime;
            maiorTempoMaquina = machine;
        }

        if (status.statusText === "Ativo") ativas++;
        else if (status.statusText.startsWith("Inativo")) inativas++;
        else {
            semDados++;
            inativas++;
        }

        totalAlertas += alertasMaquina.length;
    }

    if (maiorTempoMaquina) {
        document.getElementById("tempo-uso").textContent = formatarHoras(maiorTempo);
        document.getElementById("maquina-tempo").textContent = `Máquina: ${maiorTempoMaquina.serial_number}`;

        const ultimaMaquina = machines.find(maquinas => maquinas.serial_number === maiorTempoMaquina.serial_number);

        if (ultimaMaquina) {
            const idMaquina = ultimaMaquina.id_maquina;

            const card = document.getElementById("kpi-maior-tempo");
            card.onclick = () => analiseDetalhada(idMaquina);
            card.style.cursor = "pointer";
        }
    }

    existingRows.forEach(row => row.remove());

    kpiStatusMauquinas({
        ativas,
        inativas,
        semDados,
        total: machines.length,
        totalAlertas
    });
}

function updateTableRow(row, data) {
    const statusCell = row.querySelector(".status");
    if (statusCell) {
        statusCell.textContent = data.status.text;
        statusCell.style.color = data.status.color;
    }

    const uptimeCell = row.querySelector(".uptime");
    if (uptimeCell) uptimeCell.textContent = data.uptime;

    const alertasCell = row.querySelector(".alertas-count");
    if (alertasCell) alertasCell.textContent = data.alertasCount;

    const ultimoAlertaCell = row.querySelector(".ultimo-alerta");
    if (ultimoAlertaCell) ultimoAlertaCell.innerHTML = data.ultimoAlerta;

    const ramCell = row.querySelector(".ram");
    if (ramCell) ramCell.textContent = data.ram;

    const cpuCell = row.querySelector(".cpu");
    if (cpuCell) cpuCell.textContent = data.cpu;

    const discoCell = row.querySelector(".disco");
    if (discoCell) discoCell.textContent = data.disco;
}

function formatarHoras(valor) {
    const h = Math.floor(valor);
    const m = Math.floor((valor % 1) * 60);
    return `${h}h${m.toString().padStart(2, "0")}min`;
}

function analiseDetalhada(idMaquina) {
    window.location = `./dash_analiseDetalhada.html?id=${idMaquina}`;
}

async function fetchTickets() {
    try {                                                                                                   
        const response = await fetch('/jira/tickets');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const data = await response.json();

        if (Array.isArray(data)) {
            if (document.getElementById("iptMaquina") && document.getElementById("iptMaquina").value) {
                 PesquisarMaquina(data);
            } else {
                renderTickets(data);
            }
        } else {
            console.error('A resposta não contém tickets ou não é um array:', data);
            const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
            if (tabela) {
                tabela.innerHTML = '<tr><td colspan="10">Nenhum ticket encontrado ou formato inválido.</td></tr>';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
        if (tabela) {
            tabela.innerHTML = '<tr><td colspan="10">Erro ao carregar tickets.</td></tr>';
        }
    }
}


function PesquisarMaquina(todosOsTickets) {
    if (!todosOsTickets || !Array.isArray(todosOsTickets)) {
        console.error("PesquisarMaquina chamada sem um array de tickets válido.");
        const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
        if (tabela) tabela.innerHTML = '<tr><td colspan="10">Dados de tickets inválidos para pesquisa.</td></tr>';
        return;
    }

    var varMaquina = iptMaquina.value.trim();
    const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
    const NUM_COLUNAS = 10;

    if (!tabela) {
        console.error("Elemento da tabela (tbody) não encontrado!");
        return;
    }
    tabela.innerHTML = '';

    const ticketsDaMaquinaEspecifica = todosOsTickets.filter(ticket => {
        let numeroSerial = "Desconhecido";
        if (ticket.summary) {
            const parts = ticket.summary.trim().split(/\s+/);
            if (parts.length >= 2 && parts[0].toLowerCase() === "máquina") {
                numeroSerial = parts[1];
            } else {
                numeroSerial = parts[0];
            }
        }
        return numeroSerial.toLowerCase() === varMaquina.toLowerCase();
    });

    if (ticketsDaMaquinaEspecifica.length === 0) {
        tabela.innerHTML = `<tr><td colspan="${NUM_COLUNAS}">Nenhum ticket encontrado para a máquina: ${varMaquina}.</td></tr>`;
        return;
    }

    const urgenciaPrioridade = { "Leve": 1, "Grave": 2, "Crítico": 3, "Desconhecido": 0 };
    const recursosNomes = ['CPU', 'Memória', 'Disco', 'Rede', 'Tempo de Uso', 'Bateria'];
    const baseUrl = "https://sentinelacomvc.atlassian.net/browse/";

    const primeiroTicketFiltrado = ticketsDaMaquinaEspecifica[0];
    const dadosAgregadosDaMaquina = {
        numeroSerial: varMaquina,
        maxUrgenciaMaquina: "Desconhecido",
        prioridadeUrgenciaMaquina: 0,
        alertasPorRecurso: {},
        links: [],
        primeiroAlertaData: new Date(primeiroTicketFiltrado.createdDate.iso8601 || primeiroTicketFiltrado.createdDate.jira),
        ultimoAlertaData: new Date(primeiroTicketFiltrado.createdDate.iso8601 || primeiroTicketFiltrado.createdDate.jira),
        primeiroAlertaLink: `${baseUrl}${primeiroTicketFiltrado.issueKey}`,
        ultimoAlertaLink: `${baseUrl}${primeiroTicketFiltrado.issueKey}`,
    };

    recursosNomes.forEach(rNome => {
        dadosAgregadosDaMaquina.alertasPorRecurso[rNome] = {
            count: 0,
            maxUrgenciaParaEsteRecurso: "Desconhecido",
            prioridadeUrgenciaParaEsteRecurso: 0
        };
    });

    ticketsDaMaquinaEspecifica.forEach(ticket => {
        const status = ticket.currentStatus.status;
        if (status === "Em andamento" || status === "Pendente") {
            return;
        }

        const urgenciaField = ticket.requestFieldValues?.find(field => field.fieldId === "customfield_10059");
        let urgencia = urgenciaField?.value?.value || "Desconhecido";
        urgencia = urgencia.toString().trim();
        urgencia = urgencia.charAt(0).toUpperCase() + urgencia.slice(1).toLowerCase();
        if (!urgenciaPrioridade.hasOwnProperty(urgencia)) urgencia = "Desconhecido";

        const recursoField = ticket.requestFieldValues?.find(field => field.fieldId === "customfield_10058");
        let recurso = recursoField?.value?.value || "Desconhecido";
        recurso = recurso.toString().trim();
        if (recurso.toLowerCase() === "memória ram") recurso = "Memória";
        if (recurso.toLowerCase() === "tempo de uso (uptime)") recurso = "Tempo de Uso";
        if (!recursosNomes.includes(recurso)) recurso = "Desconhecido";

        const createdDate = new Date(ticket.createdDate.iso8601 || ticket.createdDate.jira);
        const link = `${baseUrl}${ticket.issueKey}`;

        if (createdDate < dadosAgregadosDaMaquina.primeiroAlertaData) {
            dadosAgregadosDaMaquina.primeiroAlertaData = createdDate;
            dadosAgregadasDaMaquina.primeiroAlertaLink = link;
        }
        if (createdDate > dadosAgregadosDaMaquina.ultimoAlertaData) {
            dadosAgregadasDaMaquina.ultimoAlertaData = createdDate;
            dadosAgregadasDaMaquina.ultimoAlertaLink = link;
        }
        dadosAgregadasDaMaquina.links.push({ url: link, date: createdDate });

        if (recurso !== "Desconhecido" && dadosAgregadosDaMaquina.alertasPorRecurso[recurso]) {
            const recursoNaMaquina = dadosAgregadasDaMaquina.alertasPorRecurso[recurso];
            recursoNaMaquina.count++;
            if (urgenciaPrioridade[urgencia] > recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso) {
                recursoNaMaquina.maxUrgenciaParaEsteRecurso = urgencia;
                recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso = urgenciaPrioridade[urgencia];
            }
        }

        if (urgenciaPrioridade[urgencia] > dadosAgregadosDaMaquina.prioridadeUrgenciaMaquina) {
            dadosAgregadasDaMaquina.maxUrgenciaMaquina = urgencia;
            dadosAgregadasDaMaquina.prioridadeUrgenciaMaquina = urgenciaPrioridade[urgencia];
        }
    });

    const linha = document.createElement("tr");
    const celSerial = document.createElement("td");
    const spanSerial = document.createElement("span");
    spanSerial.innerText = dadosAgregadosDaMaquina.numeroSerial;

    if (dadosAgregadosDaMaquina.maxUrgenciaMaquina === "Crítico") {
        spanSerial.classList.add("serial-highlight-red");
    } else if (dadosAgregadasDaMaquina.maxUrgenciaMaquina === "Grave") {
        spanSerial.classList.add("serial-highlight-yellow");
    } else if (dadosAgregadasDaMaquina.maxUrgenciaMaquina === "Leve") {
        spanSerial.classList.add("serial-highlight-green");
    } else {
        spanSerial.classList.add("serial-highlight-gray");
    }
    celSerial.appendChild(spanSerial);
    linha.appendChild(celSerial);

    recursosNomes.forEach(recursoNome => {
        const td = document.createElement("td");
        const dadosDoRecurso = dadosAgregadasDaMaquina.alertasPorRecurso[recursoNome];
        const qtdAlertasEsteRecurso = dadosDoRecurso.count;

        td.innerText = qtdAlertasEsteRecurso > 0 ? qtdAlertasEsteRecurso : "";
        td.classList.add("fontAdjust");

        if (qtdAlertasEsteRecurso > 0) {
            if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Crítico") {
                td.style.color = "rgba(254, 73, 78, 1)";
            } else if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Grave") {
                td.style.color = "rgba(255, 170, 0, 1)";
            } else if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Leve") {
                td.style.color = "rgba(118, 198, 126, 1)";
            } else {
                td.style.color = "black";
            }
        }
        linha.appendChild(td);
    });

    const celLink = document.createElement("td");
    const aLinkPrincipal = document.createElement("a");

    if (dadosAgregadasDaMaquina.links.length > 0) {
        dadosAgregadasDaMaquina.links.sort((linkA, linkB) => linkB.date - linkA.date);
        aLinkPrincipal.href = "dadosAgregadasDaMaquina.links[0].url";
    } else {
        aLinkPrincipal.href = "#";
    }
    aLinkPrincipal.innerText = "Ver ticket(s)";
    aLinkPrincipal.target = "_blank";
    celLink.appendChild(aLinkPrincipal);
    linha.appendChild(celLink);

    const celPrimeiroAlerta = document.createElement("td");
    const aPrimeiroAlerta = document.createElement("a");
    aPrimeiroAlerta.href = dadosAgregadasDaMaquina.primeiroAlertaLink || "#";
    aPrimeiroAlerta.target = "_blank";
    aPrimeiroAlerta.innerText = dadosAgregadasDaMaquina.primeiroAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosAgregadasDaMaquina.primeiroAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    celPrimeiroAlerta.appendChild(aPrimeiroAlerta);
    linha.appendChild(celPrimeiroAlerta);

    const celUltimoAlerta = document.createElement("td");
    const aUltimoAlerta = document.createElement("a");
    aUltimoAlerta.href = dadosAgregadasDaMaquina.ultimoAlertaLink || "#";
    aUltimoAlerta.target = "_blank";
    aUltimoAlerta.innerText = dadosAgregadasDaMaquina.ultimoAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosAgregadasDaMaquina.ultimoAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    celUltimoAlerta.appendChild(aUltimoAlerta);
    linha.appendChild(celUltimoAlerta);

    tabela.appendChild(linha);
}


function renderTickets(tickets) {
    const divPctCrit = document.getElementById("pctMaquinasCrit");
    const divPctGrave = document.getElementById("pctMaquinasGrave");
    const divPctComum = document.getElementById("pctMaquinasComuns");

    const iQtdCrit = document.getElementById("qtdMaquinasCrit");
    const iQtdGrave = document.getElementById("qtdMaquinasGrave");
    const iQtdComum = document.getElementById("qtdMaquinasComuns");

    const tabela = document.getElementById("tabaletaMaquinas").querySelector("tbody");
    tabela.innerHTML = '';

    const maquinasAgregadas = {};
    const urgenciaPrioridade = { "Leve": 1, "Grave": 2, "Crítico": 3, "Desconhecido": 0 };
    const recursosNomes = ['CPU', 'Memória', 'Disco', 'Rede', 'Tempo de Uso', 'Bateria'];
    const baseUrl = "https://sentinelacomvc.atlassian.net/browse/";

    tickets.forEach(ticket => {

        const status = ticket.currentStatus.status;

        if (status === "Em andamento" || status === "Pendente") {
            return;
        }

        let numeroSerial = "Desconhecido";
        if (ticket.summary) {
            const parts = ticket.summary.trim().split(/\s+/);
            if (parts.length >= 2 && parts[0].toLowerCase() === "máquina") {
                numeroSerial = parts[1];
            } else {
                numeroSerial = parts[0];
            }
        }

        const urgenciaField = ticket.requestFieldValues?.find(field => field.fieldId === "customfield_10059");
        let urgencia = urgenciaField?.value?.value || "Desconhecido";
        urgencia = urgencia.toString().trim();
        urgencia = urgencia.charAt(0).toUpperCase() + urgencia.slice(1).toLowerCase();
        if (!urgenciaPrioridade.hasOwnProperty(urgencia)) urgencia = "Desconhecido";


        const recursoField = ticket.requestFieldValues?.find(field => field.fieldId === "customfield_10058");
        let recurso = recursoField?.value?.value || "Desconhecido";
        recurso = recurso.toString().trim();
        if (recurso.toLowerCase() === "memória ram") recurso = "Memória";
        if (recurso.toLowerCase() === "tempo de uso (uptime)") recurso = "Tempo de Uso";
        if (!recursosNomes.includes(recurso)) recurso = "Desconhecido";

        const link = `${baseUrl}${ticket.issueKey}`;
        const createdDate = new Date(ticket.createdDate.iso8601 || ticket.createdDate.jira);


        if (!maquinasAgregadas[numeroSerial]) {
            maquinasAgregadas[numeroSerial] = {
                numeroSerial: numeroSerial,
                maxUrgenciaMaquina: "Desconhecido",
                prioridadeUrgenciaMaquina: 0,
                alertasPorRecurso: {},
                links: [],
                primeiroAlertaData: createdDate,
                ultimoAlertaData: createdDate,
                primeiroAlertaLink: link,
                ultimoAlertaLink: link,
            };
            recursosNomes.forEach(rNome => {
                maquinasAgregadas[numeroSerial].alertasPorRecurso[rNome] = {
                    count: 0,
                    maxUrgenciaParaEsteRecurso: "Desconhecido",
                    prioridadeUrgenciaParaEsteRecurso: 0
                };
            });
        }

        const maquinaAtual = maquinasAgregadas[numeroSerial];

        if (createdDate < maquinaAtual.primeiroAlertaData) {
            maquinaAtual.primeiroAlertaData = createdDate;
            maquinaAtual.primeiroAlertaLink = link;
        }
        if (createdDate > maquinaAtual.ultimoAlertaData) {
            maquinaAtual.ultimoAlertaData = createdDate;
            maquinaAtual.ultimoAlertaLink = link;
        }

        maquinaAtual.links.push({ url: link, date: createdDate });

        if (recurso !== "Desconhecido" && maquinasAgregadas[numeroSerial].alertasPorRecurso[recurso]) {
            const recursoNaMaquina = maquinaAtual.alertasPorRecurso[recurso];
            recursoNaMaquina.count++;
            if (urgenciaPrioridade[urgencia] > recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso) {
                recursoNaMaquina.maxUrgenciaParaEsteRecurso = urgencia;
                recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso = urgenciaPrioridade[urgencia];
            }
        }


        if (urgenciaPrioridade[urgencia] > maquinaAtual.prioridadeUrgenciaMaquina) {
            maquinaAtual.maxUrgenciaMaquina = urgencia;
            maquinaAtual.prioridadeUrgenciaMaquina = urgenciaPrioridade[urgencia];
        }
    });


    const maquinasOrdenadas = Object.values(maquinasAgregadas).sort((a, b) => {
        if (b.prioridadeUrgenciaMaquina !== a.prioridadeUrgenciaMaquina) {
            return b.prioridadeUrgenciaMaquina - a.prioridadeUrgenciaMaquina;
        }
        return b.ultimoAlertaData - a.ultimoAlertaData;
    });


    let qtdMaquinasCritico = 0;
    let qtdMaquinasGrave = 0;
    let qtdMaquinasLeve = 0;

    const alertasPorRecursoEUrgenciaGlobal = {};
    recursosNomes.forEach(rec => {
        alertasPorRecursoEUrgenciaGlobal[rec] = { Crítico: 0, Grave: 0, Leve: 0, Desconhecido: 0 };
    });
    let contagemTotalAlertasPorRecurso = {};
    recursosNomes.forEach(rec => contagemTotalAlertasPorRecurso[rec] = 0);

    maquinasOrdenadas.forEach(dadosMaquina => {
        if (dadosMaquina.maxUrgenciaMaquina === "Crítico") qtdMaquinasCritico++;
        else if (dadosMaquina.maxUrgenciaMaquina === "Grave") qtdMaquinasGrave++;
        else if (dadosMaquina.maxUrgenciaMaquina === "Leve") qtdMaquinasLeve++;

        const linha = document.createElement("tr");

        const celSerial = document.createElement("td");
        const spanSerial = document.createElement("span");
        spanSerial.innerText = dadosMaquina.numeroSerial;
        if (dadosMaquina.maxUrgenciaMaquina === "Crítico") {
            spanSerial.classList.add("serial-highlight-red");
        } else if (dadosMaquina.maxUrgenciaMaquina === "Grave") {
            spanSerial.classList.add("serial-highlight-yellow");
        } else if (dadosMaquina.maxUrgenciaMaquina === "Leve") {
            spanSerial.classList.add("serial-highlight-green");
        } else {
            spanSerial.classList.add("serial-highlight-gray");
        }
        celSerial.appendChild(spanSerial);
        linha.appendChild(celSerial);

        recursosNomes.forEach(recursoNome => {
            const td = document.createElement("td");
            const dadosDoRecursoEspecifico = dadosMaquina.alertasPorRecurso[recursoNome];
            const qtdAlertasEsteRecurso = dadosDoRecursoEspecifico.count;

            td.innerText = qtdAlertasEsteRecurso > 0 ? qtdAlertasEsteRecurso : "";
            td.classList.add("fontAdjust")


            if (qtdAlertasEsteRecurso > 0) {
                contagemTotalAlertasPorRecurso[recursoNome] += qtdAlertasEsteRecurso;
                if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso !== "Desconhecido") {
                    alertasPorRecursoEUrgenciaGlobal[recursoNome][dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso]++;
                }


                if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Crítico") {
                    td.style.color = "rgba(254, 73, 78, 1)";
                } else if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Grave") {
                    td.style.color = "rgba(255, 170, 0, 1)";
                } else if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Leve") {
                    td.style.color = "rgba(118, 198, 126, 1)";
                } else {
                    td.style.color = "black";
                }
            }

            linha.appendChild(td);
        });

        const celLink = document.createElement("td");
        const aLinkPrincipal = document.createElement("a");
        if (dadosMaquina.links.length > 0) {
            dadosMaquina.links.sort((linkA, linkB) => linkB.date - linkA.date);
            aLinkPrincipal.href = dadosMaquina.links[0].url;
        } else {
            aLinkPrincipal.href = "#";
        }
        aLinkPrincipal.innerText = "Ver ticket(s)";
        aLinkPrincipal.target = "_blank";
        celLink.appendChild(aLinkPrincipal);
        linha.appendChild(celLink);

        const celPrimeiroAlerta = document.createElement("td");
        const aPrimeiroAlerta = document.createElement("a");
        aPrimeiroAlerta.href = dadosMaquina.primeiroAlertaLink || "#";
        aPrimeiroAlerta.target = "_blank";
        aPrimeiroAlerta.innerText = dadosMaquina.primeiroAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosMaquina.primeiroAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        celPrimeiroAlerta.appendChild(aPrimeiroAlerta);
        linha.appendChild(celPrimeiroAlerta);

        const celUltimoAlerta = document.createElement("td");
        const aUltimoAlerta = document.createElement("a");
        aUltimoAlerta.href = dadosMaquina.ultimoAlertaLink || "#";
        aUltimoAlerta.target = "_blank";
        aUltimoAlerta.innerText = dadosMaquina.ultimoAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosMaquina.ultimoAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        celUltimoAlerta.appendChild(aUltimoAlerta);
        linha.appendChild(celUltimoAlerta);

        tabela.appendChild(linha);
    });

    const qtdMaquinasAlertasTotais = qtdMaquinasCritico + qtdMaquinasGrave + qtdMaquinasLeve;

    if (qtdMaquinasAlertasTotais > 0) {
        divPctCrit.innerText = ((qtdMaquinasCritico / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
        divPctGrave.innerText = ((qtdMaquinasGrave / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
        divPctComum.innerText = ((qtdMaquinasLeve / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
    } else {
        divPctCrit.innerText = "0%";
        divPctGrave.innerText = "0%";
        divPctComum.innerText = "0%";
    }

    iQtdCrit.innerText = `${qtdMaquinasCritico} máquinas com alertas crítico`;
    iQtdGrave.innerText = `${qtdMaquinasGrave} máquinas com alertas graves`;
    iQtdComum.innerText = `${qtdMaquinasLeve} máquinas com alertas leves`;

    if (window.myChartInstance) {
        window.myChartInstance.destroy();
    }

    const ctx = document.getElementById('myChart');
    if (!ctx) {
        return;
    }

    const dataValues = recursosNomes.map(rec => contagemTotalAlertasPorRecurso[rec]);
    const maxValue = Math.max(...dataValues, 1);

    const coresUrgencia = {
        Crítico: `rgba(255, 106, 106, ALPHA)`,
        Grave: `rgb(255, 211, 100, ALPHA)`,
        Leve: `rgba(118, 198, 126, ALPHA)`,
        Desconhecido: `rgba(128, 128, 128, ALPHA)`
    };

    const backgroundColor = dataValues.map((valorAtual, index) => {
        const recursoAtual = recursosNomes[index];
        const urgenciasDoRecurso = alertasPorRecursoEUrgenciaGlobal[recursoAtual];
        let urgenciaCorPredominante = "Leve";

        if (urgenciasDoRecurso["Crítico"] > 0) {
            urgenciaCorPredominante = "Crítico";
        } else if (urgenciasDoRecurso["Grave"] > 0) {
            urgenciaCorPredominante = "Grave";
        } else if (urgenciasDoRecurso["Leve"] > 0) {
            urgenciaCorPredominante = "Leve";
        } else if (valorAtual > 0) {
            urgenciaCorPredominante = "Desconhecido";
        }


        const alpha = valorAtual > 0 ? Math.max(valorAtual / maxValue, 0.3) : 0.1;
        return coresUrgencia[urgenciaCorPredominante].replace("ALPHA", alpha.toFixed(2));
    });

    window.myChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: recursosNomes,
            datasets: [{
                label: 'Quantidade de conflitos',
                data: dataValues,
                backgroundColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 12
                        },
                        generateLabels: function (chart) {
                            return [
                                { text: 'Possui alertas críticos', fillStyle: coresUrgencia.Crítico.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Crítico.replace("ALPHA", "1"), lineWidth: 1 },
                                { text: 'Possui alertas graves', fillStyle: coresUrgencia.Grave.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Grave.replace("ALPHA", "1"), lineWidth: 1 },
                                { text: 'Somente alertas leves', fillStyle: coresUrgencia.Leve.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Leve.replace("ALPHA", "1"), lineWidth: 1 }
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    carregarMaquinas();
    fetchTickets(); 
    setInterval(carregarMaquinas, 3000);
    setInterval(fetchTickets, 3000);
});