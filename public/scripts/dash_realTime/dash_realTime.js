// if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
//     alert("Sua sessão expirou! Logue-se novamente.");
//     window.location.href = "../login.html";
// }


const BASE_URL = window.location.hostname === "localhost"
  ? "localhost:3333"
  : "18.208.5.45:3333";

const usuario = {
    idEmpresa: sessionStorage.idEmpresa,
    idUsuario: sessionStorage.idUsuario,
    email: sessionStorage.email,
    tipoUsuario: sessionStorage.tipoUsuario,
    nomeUsuario: sessionStorage.nomeUsuario
};


async function carregarMaquinas() {
    try {
        const [machinesResponse, alertsResponse] = await Promise.all([
            fetch(`http://${BASE_URL}/maquinas/${usuario.idEmpresa}`),
            fetch(`http://${BASE_URL}/jira/tickets`)
        ]);

        if (!machinesResponse.ok || !alertsResponse.ok) throw new Error('Erro ao buscar dados');

        const [machines, alertsData] = await Promise.all([
            machinesResponse.json(),
            alertsResponse.json()
        ]);

        const allAlerts = (alertsData.values || []).filter(ticket => 
            ticket && String(ticket.requestTypeId) === "68"
        );

        const tableBody = document.querySelector('.table_body');
        
        // Não limpa mais a tabela completamente
        // tableBody.innerHTML = '';  <-- Remover esta linha
        
        // Mapa para rastrear quais linhas já existem na tabela
        const existingRows = new Map();
        document.querySelectorAll(".table_body tr").forEach(row => {
            const id = row.getAttribute("data-machine-id");
            if (id) existingRows.set(id, row);
        });

        let ativas = 0, inativas = 0, semDados = 0, totalAlertas = 0;

        for (const machine of machines) {
            const metricsResponse = await fetch(`http://${BASE_URL}/medidas/${machine.id_maquina}`);
            const metrics = metricsResponse.ok ? await metricsResponse.json() : {};

            // Verificar o formato dos dados
            const temDados = metrics.dados && !Array.isArray(metrics.dados);
            const semDadosResponse = metrics.mensagem && metrics.mensagem.includes("Sem dados");
            
            const getValor = (tipo) => {
                if (!temDados || !metrics.dados[tipo] || metrics.dados[tipo].length === 0) return null;
                const latest = metrics.dados[tipo][metrics.dados[tipo].length - 1]; 
                return latest ? latest.valor : null;
            };

            let statusText = 'Sem dados', statusColor = 'gray';

            if (temDados) {
                let captureTimestamp = null;
                for (const tipo in metrics.dados) {
                    if (metrics.dados[tipo]?.length > 0) {
                        captureTimestamp = metrics.dados[tipo][metrics.dados[tipo].length - 1].timestamp;  
                        break;
                    }
                }

                if (captureTimestamp) {
                    const captura = new Date(captureTimestamp);
                    const agora = new Date();
                    const segundos = (agora - captura) / 1000;  

                    if (segundos <= 15) {
                        statusText = 'Ativo';
                        statusColor = 'green';
                        ativas++;
                    } else {
                        statusText = `Inativo (${captura.toLocaleString('pt-BR')})`;
                        statusColor = 'red';
                        inativas++;
                    }
                } else {
                    statusText = 'Sem dados';
                    statusColor = 'gray';
                    semDados++;
                    inativas++; 
                }
            } else {
                statusText = 'Sem dados';
                statusColor = 'gray';
                semDados++;
                inativas++; 
            }

            const serial = machine.serial_number;
            const alertasMaquina = allAlerts.filter(ticket => 
                ticket.summary?.includes(serial) || ticket.issueKey?.includes(serial)
            );
            totalAlertas += alertasMaquina.length;

            const ultimaDataAlerta = alertasMaquina.reduce((maisRecente, alerta) => {
                const alertaData = alerta.createdDate?.iso8601 ? new Date(alerta.createdDate.iso8601) : null;
                if (!maisRecente || (alertaData && alertaData > maisRecente)) {
                    return alertaData;
                }
                return maisRecente;
            }, null);

            const linkUltimoAlerta = alertasMaquina.length > 0 ? `
                <a href="${alertasMaquina[0]._links?.web || '#'}" 
                   target="_blank" 
                   style="color: #dc3545; text-decoration: none; font-weight: 500;"
                   title="Abrir chamado no Jira">
                   ${ultimaDataAlerta?.toLocaleString('pt-BR') || 'N/A'} (${alertasMaquina[0].issueKey || 'N/A'})
                </a>
            ` : 'Nenhum';

            const uptime = getValor('uptime_hours');
            const ram = getValor('ram_percent');
            const cpu = getValor('cpu_percent');
            const disco = getValor('disk_percent');

            const machineId = `machine-${machine.id_maquina}`;
            let row = existingRows.get(machineId);
            
            if (row) {
                updateTableRow(row, {
                    status: { text: statusText, color: statusColor },
                    uptime: uptime !== null ? formatarHoras(uptime) : '-',
                    alertasCount: alertasMaquina.length,
                    ultimoAlerta: linkUltimoAlerta,
                    ram: ram !== null ? Math.round(ram) : '-',
                    cpu: cpu !== null ? Math.round(cpu) : '-',
                    disco: disco !== null ? Math.round(disco) : '-'
                });
                
                // Remover do mapa para saber quais linhas permanecem
                existingRows.delete(machineId);
            } else {
                // Criar uma nova linha se não existir
                row = document.createElement('tr');
                row.setAttribute("data-machine-id", machineId);
                row.innerHTML = `
                    <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                    <td class="status" style="color: ${statusColor}">${statusText}</td>
                    <td class="uptime">${uptime !== null ? formatarHoras(uptime) : '-'}</td>
                    <td class="alertas-count">${alertasMaquina.length}</td>
                    <td class="ultimo-alerta">${linkUltimoAlerta}</td>
                    <td class="ram">${ram !== null ? Math.round(ram) : '-'}</td>
                    <td class="cpu">${cpu !== null ? Math.round(cpu) : '-'}</td>
                    <td class="disco">${disco !== null ? Math.round(disco) : '-'}</td>
                    <td><button class="details-btn" onclick="analiseDetalhada(${machine.id_maquina})" data-id="${machine.id_maquina}">Expandir Análise</button></td>
                `;
                
                tableBody.appendChild(row);
            }
        }

        // Remover linhas que não correspondem mais a nenhuma máquina ativa
        existingRows.forEach((row) => {
            row.remove();
        });

        // Atualizar os KPIs
        const kpiAtivas = document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[0];
        const kpiInativas = document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[1];
        
        if (kpiAtivas) kpiAtivas.textContent = ativas;
        if (kpiInativas) kpiInativas.textContent = `${inativas} (${semDados} sem dados)`;
        
        const qtdAlertas = document.getElementById('qtd_alertas');
        if (qtdAlertas) qtdAlertas.textContent = totalAlertas;

    } catch (error) {
        console.error('Erro ao carregar máquinas:', error);
        const kpiElements = document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)');
        if (kpiElements.length >= 2) {
            kpiElements[0].textContent = '0';
            kpiElements[1].textContent = '0 (0 sem dados)';
        }
        document.getElementById('qtd_alertas').textContent = '0';
    }
}

// Função auxiliar para atualizar apenas os valores alterados em uma linha existente
function updateTableRow(row, data) {
    // Atualiza o status
    const statusCell = row.querySelector('.status');
    if (statusCell) {
        statusCell.textContent = data.status.text;
        statusCell.style.color = data.status.color;
    }
    
    // Atualiza uptime
    const uptimeCell = row.querySelector('.uptime');
    if (uptimeCell) uptimeCell.textContent = data.uptime;
    
    // Atualiza contagem de alertas
    const alertasCell = row.querySelector('.alertas-count');
    if (alertasCell) alertasCell.textContent = data.alertasCount;
    
    // Atualiza último alerta (pode conter HTML)
    const ultimoAlertaCell = row.querySelector('.ultimo-alerta');
    if (ultimoAlertaCell) ultimoAlertaCell.innerHTML = data.ultimoAlerta;
    
    // Atualiza RAM
    const ramCell = row.querySelector('.ram');
    if (ramCell) ramCell.textContent = data.ram;
    
    // Atualiza CPU
    const cpuCell = row.querySelector('.cpu');
    if (cpuCell) cpuCell.textContent = data.cpu;
    
    // Atualiza Disco
    const discoCell = row.querySelector('.disco');
    if (discoCell) discoCell.textContent = data.disco;
}

function formatarHoras(valor) {
    const h = Math.floor(valor);
    const m = Math.floor((valor % 1) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
}

function analiseDetalhada(idMaquina) {
    window.location = `./dash_analiseDetalhada.html?id=${idMaquina}`;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarMaquinas();
    setInterval(carregarMaquinas, 3000);
});