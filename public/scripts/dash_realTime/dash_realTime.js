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
        const [machinesResponse, alertsResponse] = await Promise.all([
            fetch(`http://${BASE_URL}/maquinas/${usuario.idEmpresa}`),
            fetch(`http://${BASE_URL}/jira/tickets`),
        ]);

        if (!machinesResponse.ok) { throw new Error("Erro ao buscar dados das máquinas"); }
        if (!alertsResponse.ok) { throw new Error("Erro ao buscar dados de alertas"); }

        const [machines, alertsData] = await Promise.all([
            machinesResponse.json(),
            alertsResponse.json(),
        ]);

        const allAlerts = (alertsData.values || []).filter(
            (ticket) => ticket && String(ticket.requestTypeId) === "5"
        );

        const alertasOrdenados = allAlerts.sort((a, b) => b.createdDate.epochMillis - a.createdDate.epochMillis);
        const ultimoAlerta = alertasOrdenados[0];
        const maquina = ultimoAlerta.summary?.replace("Máquina ", "") || "";
        const tempoDecorridoMs = Date.now() - ultimoAlerta.createdDate.epochMillis;
        const minutos = Math.floor(tempoDecorridoMs / 60000);
        // const descricaoCampo = ultimoAlerta.requestFieldValues.find(f => f.fieldId === "description")?.value || "";
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

        document.getElementById("alerta-recurso").textContent = `Alerta ${nivel} de ${recurso}`;
        document.getElementById("alerta-detalhes").textContent = `${maquina} • há ${minutos} min`;

        // Armazena o id do html da lista das máquinas para plotar as máquinas
        const tableBody = document.querySelector(".table_body");

        const existingRows = new Map();
        document.querySelectorAll(".table_body tr").forEach((row) => {
            const id = row.getAttribute("data-machine-id");
            if (id) existingRows.set(id, row);
        });

        let ativas = 0,
            inativas = 0,
            semDados = 0,
            totalAlertas = 0;

        // Ordenar as máquinas do maior para o menor de alertas
        machines.sort((a, b) => {
            const aSerial = a.serial_number;
            const bSerial = b.serial_number;

            const alertasA = allAlerts
                .filter(ticket => ticket.summary?.includes(aSerial) || ticket.issueKey?.includes(aSerial))
                .reduce((total, ticket) => {
                    const urgenciaField = ticket.requestFieldValues?.find(f => f.label === "Urgência");
                    const nivel = urgenciaField?.value?.value;

                    if (nivel === "Leve") return total + 1;
                    if (nivel === "Grave") return total + 2;
                    if (nivel === "Crítico") return total + 3;
                    return total;
                }, 0);

            const alertasB = allAlerts
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

        let maiorTempo = 0;
        let maiorTempoMaquina = null;

        const seriais = [];

        allAlerts.forEach(alerta => {
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

        document.querySelector("#kpi-mais-alertas .kpi-value").textContent = maquinaMaisAlerts;
        document.querySelector("#kpi-mais-alertas .kpi-subtitle").textContent = `${maxAlertas} ${frase}`;


        for (const machine of machines) {
            const metricsResponse = await fetch(
                `http://${BASE_URL}/medidas/${machine.id_maquina}`
            );

            const metrics = metricsResponse.ok ? await metricsResponse.json() : {};
            const temDados = metrics.dados && !Array.isArray(metrics.dados);
            const semDadosResponse = metrics.mensagem && metrics.mensagem.includes("Sem dados");

            const getValor = (tipo) => {
                if (!temDados ||
                    !metrics.dados[tipo] ||
                    metrics.dados[tipo].length === 0
                )
                    return null;
                const latest = metrics.dados[tipo][metrics.dados[tipo].length - 1];
                return latest ? latest.valor : null;

            };

            let statusText = "Sem dados",
                statusColor = "gray";

            if (temDados) {
                let captureTimestamp = null;
                for (const tipo in metrics.dados) {
                    if (metrics.dados[tipo]?.length > 0) {
                        captureTimestamp =
                            metrics.dados[tipo][metrics.dados[tipo].length - 1].timestamp;
                        break;
                    }
                }

                if (captureTimestamp) {
                    const captura = new Date(captureTimestamp);
                    const agora = new Date();
                    const segundos = (agora - captura) / 1000;

                    if (segundos <= 15) {
                        statusText = "Ativo";
                        statusColor = "#4caf50";
                        ativas++;
                    } else {
                        statusText = `Inativo (${captura.toLocaleString("pt-BR")})`;
                        statusColor = "#d32f2f";
                        inativas++;
                    }
                } else {
                    statusText = "Sem dados";
                    statusColor = "gray";
                    semDados++;
                    inativas++;
                }
            } else {
                statusText = "Sem dados";
                statusColor = "gray";
                semDados++;
                inativas++;
            }

            const serial = machine.serial_number;
            const alertasMaquina = allAlerts.filter(
                (ticket) =>
                    ticket.summary?.includes(serial) || ticket.issueKey?.includes(serial)
            );

            const ultimaDataAlerta = alertasMaquina.reduce((maisRecente, alerta) => {
                const alertaData = alerta.createdDate?.iso8601 ?
                    new Date(alerta.createdDate.iso8601) :
                    null;
                if (!maisRecente || (alertaData && alertaData > maisRecente)) {
                    return alertaData;
                }
                return maisRecente;
            }, null);

            const linkUltimoAlerta =
                alertasMaquina.length > 0 ?
                    ` <a href="${alertasMaquina[0]._links?.web || "#"}" target="_blank" 
                        style="color: #d32f2f; text-decoration: none; font-weight: 500;"
                        title="Abrir chamado no Jira"> ${ultimaDataAlerta?.toLocaleString("pt-BR") || "N/A"}<br>Ticket: ${alertasMaquina[0].issueKey || "N/A"}
                      </a>
                    ` : "Nenhum";

            const uptime = getValor("uptime_hours");
            const ram = getValor("ram_percent");
            const cpu = getValor("cpu_percent");
            const disco = getValor("disk_percent");
            const bateria = getValor("battery_percent");
            const netDownloadBruto = getValor("net_download");
            const netUploadBruto = getValor("net_upload");
            const downloadMbps = netDownloadBruto !== null ? netDownloadBruto * 8 * 1024 : null;
            const uploadMbps = netUploadBruto !== null ? netUploadBruto * 8 * 1024 : null;

            const machineId = `machine-${machine.id_maquina}`;
            let row = existingRows.get(machineId);

            if (uptime !== null && uptime > maiorTempo) {
                maiorTempo = uptime;
                maiorTempoMaquina = machine;
            }

            const setor = machine.setor;

            if (row) {
                updateTableRow(row, {
                    status: { text: statusText, color: statusColor },
                    uptime: uptime !== null ? formatarHoras(uptime) : "-",
                    alertasCount: alertasMaquina.length,
                    ultimoAlerta: linkUltimoAlerta,
                    ram: ram !== null ? Math.round(ram) : "-",
                    cpu: cpu !== null ? Math.round(cpu) : "-",
                    disco: disco !== null ? Math.round(disco) : "-",
                    bateria: bateria,
                    downloadMbps: downloadMbps !== null ? downloadMbps.toFixed(2) : "-",
                    uploadMbps: uploadMbps !== null ? uploadMbps.toFixed(2) : "-",
                });

                // Remover do mapa para saber quais linhas permanecem
                existingRows.delete(machineId);
            } else {
                // Criar uma nova linha se não existir
                row = document.createElement("tr");
                row.setAttribute("data-machine-id", machineId);
                row.innerHTML = `
                    <td>
                        <span style="font-weight: bold; color: ${statusColor};">${machine.serial_number}</span><br>
                        <small style="color: ${statusColor};">${setor}</small>
                    </td>
                    <td class="status" style="color: ${statusColor}">${statusText}</td>
                    <td class="uptime">${uptime !== null ? formatarHoras(uptime) : "-"}</td>
                    <td class="cpu">${cpu !== null ? Math.round(cpu) : "-"}</td>
                    <td class="ram">${ram !== null ? Math.round(ram) : "-"}</td>
                    <td class="disco">${disco !== null ? Math.round(disco) : "-"}</td>
                    <td class="download">${downloadMbps !== null ? downloadMbps.toFixed(2) : "-"}</td>
                    <td class="upload">${uploadMbps !== null ? uploadMbps.toFixed(2) : "-"}</td>
                    <td class="bateria">${bateria !== null ? bateria : "-"}</td>
                    <td class="ultimo-alerta">${linkUltimoAlerta}</td>
                    <td class="alertas-count">${alertasMaquina.length}</td>
                    <td><button class="details-btn" onclick="analiseDetalhada(${machine.id_maquina})" data-id="${machine.id_maquina}">Expandir Análise</button></td>
                `;

                tableBody.appendChild(row);
            }
        }

        if (maiorTempoMaquina) {
            document.getElementById("tempo-uso").textContent = `${formatarHoras(maiorTempo)}`;
            document.getElementById("maquina-tempo").textContent = `Máquina: ${maiorTempoMaquina.serial_number}`;
        }

        // Remover linhas que não correspondem mais a nenhuma máquina ativa
        existingRows.forEach((row) => { row.remove(); });

        // Atualizar os KPIs;
        const kpiAtivas = document.querySelectorAll(".kpi_maqRT2 span:nth-child(2)")[0];
        const kpiInativas = document.querySelectorAll(".kpi_maqRT2 span:nth-child(2)")[1];
        if (kpiAtivas) kpiAtivas.textContent = ativas;
        if (kpiInativas) kpiInativas.textContent = `${inativas} (${semDados} sem dados)`;
        const qtdAlertas = document.getElementById("qtd_alertas");
        if (qtdAlertas) qtdAlertas.textContent = totalAlertas;
        const kpiTotal = document.querySelector(".kpi-stack .kpi-mini:nth-child(1) .value");
        const kpiAtivasStack = document.querySelector(".kpi-stack .kpi-mini.active .value");
        const kpiInativasStack = document.querySelector(".kpi-stack .kpi-mini.inactive .value");

        if (kpiTotal) kpiTotal.textContent = machines.length;
        if (kpiAtivasStack) kpiAtivasStack.textContent = ativas;
        if (kpiInativasStack) kpiInativasStack.textContent = inativas;

    } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
        const kpiElements = document.querySelectorAll(
            ".kpi_maqRT2 span:nth-child(2)"
        );
        if (kpiElements.length >= 2) {
            kpiElements[0].textContent = "0";
            kpiElements[1].textContent = "0 (0 sem dados)";
        }
        document.getElementById("qtd_alertas").textContent = "0";
    }


}

// Função auxiliar para atualizar apenas os valores alterados em uma linha existente
function updateTableRow(row, data) {
    // Atualiza o status
    const statusCell = row.querySelector(".status");
    if (statusCell) {
        statusCell.textContent = data.status.text;
        statusCell.style.color = data.status.color;
    }

    // Atualiza uptime
    const uptimeCell = row.querySelector(".uptime");
    if (uptimeCell) uptimeCell.textContent = data.uptime;

    // Atualiza contagem de alertas
    const alertasCell = row.querySelector(".alertas-count");
    if (alertasCell) alertasCell.textContent = data.alertasCount;

    // Atualiza último alerta (pode conter HTML)
    const ultimoAlertaCell = row.querySelector(".ultimo-alerta");
    if (ultimoAlertaCell) ultimoAlertaCell.innerHTML = data.ultimoAlerta;

    // Atualiza RAM
    const ramCell = row.querySelector(".ram");
    if (ramCell) ramCell.textContent = data.ram;

    // Atualiza CPU
    const cpuCell = row.querySelector(".cpu");
    if (cpuCell) cpuCell.textContent = data.cpu;

    // Atualiza Disco
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