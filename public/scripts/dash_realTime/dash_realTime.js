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
        "18.208.5.45:3333";

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

        const allAlerts = (alertsData.values || []).filter(
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
        const serialProcurado = ultimoAlerta.summary?.replace("Máquina ", "") || "";
        const tempoDecorridoMs = Date.now() - ultimoAlerta.createdDate.epochMillis;
        const minutos = Math.floor(tempoDecorridoMs / 60000);
        const recurso = ultimoAlerta.requestFieldValues.find(f => f.fieldId === "customfield_10058")?.value?.value || "";
        const urgenciaField = ultimoAlerta.requestFieldValues?.find(f => f.label === "Urgência");
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

            const resumo = alerta.requestFieldValues.find(
                campo => campo.fieldId === 'summary'
            );

            if (resumo && resumo.value) {
                const partes = resumo.value.split(' ');
                numeroSerial = partes[partes.length - 1];
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
                const urgenciaField = ticket.requestFieldValues?.find(f => f.label === "Urgência");
                const nivel = urgenciaField?.value?.value;

                if (nivel === "Leve") return total + 1;
                if (nivel === "Grave") return total + 2;
                if (nivel === "Crítico") return total + 3;
                return total;
            }, 0);

        const alertasB = alerts
            .filter(ticket => ticket.summary?.includes(bSerial) || ticket.issueKey?.includes(bSerial))
            .reduce((total, ticket) => {
                const urgenciaField = ticket.requestFieldValues?.find(f => f.label === "Urgência");
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
    if (!temDados) return { statusText: "Sem dados", statusColor: "gray", segundos: null };

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

    return { statusText: "Sem dados", statusColor: "gray", segundos: null };
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

    const urgenciaField = alertaMaisRecente.requestFieldValues?.find(f => f.label === "Urgência");
    const nivel = urgenciaField?.value?.value;

    if (nivel === "Leve") {
        cor = "#f2c94c"
    } if (nivel === "Grave") {
        cor = "#f57c00"
    } if (nivel === "Crítico") {
        cor = "#d32f2f"
    }

    return alertasMaquina.length > 0
        ? ` <a href="${alertasMaquina[0]._links?.web || "#"}" 
            target="_blank" 
            title="Clique para abrir o chamado no Jira" 
            style="text-decoration: none; color: ${cor};">
            ${`há ${minutos} min` || "N/A"} 🔗
                </a>
            `
        : "Nenhum";
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

document.addEventListener("DOMContentLoaded", () => {
    carregarMaquinas();
    setInterval(carregarMaquinas, 3000);
});