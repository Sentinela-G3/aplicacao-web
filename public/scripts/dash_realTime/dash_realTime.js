// ==============================================
// VERIFICAÇÃO DE SESSÃO E CONFIGURAÇÃO INICIAL
// ==============================================
if (!sessionStorage.idEmpresa || !sessionStorage.idUsuario || !sessionStorage.email || !sessionStorage.tipoUsuario || !sessionStorage.nomeUsuario) {
    alert("Sua sessão expirou! Logue-se novamente.");
    window.location.href = "../login.html";
}

const usuario = {
    idEmpresa: sessionStorage.idEmpresa,
    idUsuario: sessionStorage.idUsuario,
    email: sessionStorage.email,
    tipoUsuario: sessionStorage.tipoUsuario,
    nomeUsuario: sessionStorage.nomeUsuario
};

document.getElementById("nome_usuario").innerHTML = usuario.nomeUsuario;

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================
const formatTime = (hours) => {
    if (!hours || hours.value === undefined || hours.value === null) return '-';
    const h = Math.floor(hours.value);
    const m = Math.floor((hours.value % 1) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
};

const formatPercent = (metric) => {
    if (!metric || metric.value === undefined || metric.value === null) return '-';
    return `${Math.round(metric.value)}`;
};

function normalizeMachineDate(timestamp, dataHoraCaptura) {
    try {
        // Prioriza o timestamp UTC se for válido
        if (timestamp && !isNaN(new Date(timestamp).getTime())) {
            return new Date(timestamp);
        }
        
        // Fallback: Parse da data_hora_captura (formato BR)
        if (dataHoraCaptura && dataHoraCaptura.includes('/') && dataHoraCaptura.includes(' - ')) {
            const [datePart, timePart] = dataHoraCaptura.split(' - ');
            const [day, month, year] = datePart.split('/');
            const [hours, minutes, seconds] = timePart.split(':');
            
            // Cria data no fuso local (Brasil) e converte para UTC
            const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
            return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        }
        
        return new Date(NaN); // Data inválida
    } catch (e) {
        console.error('Erro ao normalizar data:', e);
        return new Date(NaN);
    }
}

function formatBrazilianDate(date) {
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateCellIfChanged(cell, newValue) {
    if (cell.textContent !== newValue) {
        cell.textContent = newValue;
    }
}

function getMetricValue(metrics, type) {
    const metric = metrics.find(m => m.tipo === type);
    return metric ? { value: metric.valor, min: metric.minimo, max: metric.maximo } : null;
}

function createLastAlertHTML(alertas) {
    if (!alertas.length) return 'Nenhum';
    
    const ultimoAlerta = alertas.reduce((latest, alerta) => {
        const alertDate = normalizeMachineDate(alerta.createdDate?.iso8601, null);
        const latestDate = normalizeMachineDate(latest.createdDate?.iso8601, null);
        return alertDate > latestDate ? alerta : latest;
    });

    const dataFormatada = formatBrazilianDate(
        normalizeMachineDate(ultimoAlerta.createdDate?.iso8601, null)
    );

    return `
        <a href="${ultimoAlerta._links?.web || '#'}" 
           target="_blank" 
           style="color: #dc3545; text-decoration: none; font-weight: 500;"
           title="Abrir chamado no Jira">
           ${dataFormatada} (${ultimoAlerta.issueKey || 'N/A'})
        </a>
    `;
}

// ==============================================
// LÓGICA PRINCIPAL DE CARREGAMENTO
// ==============================================
async function carregarMaquinas() {
    try {
        const [machinesResponse, alertsResponse] = await Promise.all([
            fetch(`http://localhost:3333/maquinas/${usuario.idEmpresa}`),
            fetch('http://localhost:3333/jira/tickets')
        ]);

        if (!machinesResponse.ok || !alertsResponse.ok) throw new Error('Erro ao buscar dados');

        const [machines, alertsData] = await Promise.all([
            machinesResponse.json(),
            alertsResponse.json()
        ]);

        const allAlerts = (alertsData.values || []).filter(ticket => 
            ticket && String(ticket.requestTypeId) === "68"
        );

        // Mapeamento das linhas existentes
        const currentRows = new Map();
        document.querySelectorAll('.table_body tr').forEach(row => {
            const machineId = row.querySelector('button.details-btn')?.dataset.id;
            if (machineId) currentRows.set(machineId, row);
        });

        let ativas = 0, inativas = 0, totalAlertas = 0;
        const newRows = [];

        for (const machine of machines) {
            const metricsResponse = await fetch(`http://localhost:3333/medidas/${machine.id_maquina}/componentes`);
            const metrics = metricsResponse.ok ? await metricsResponse.json() : [];

            // Lógica de status com tratamento robusto de datas
            let statusText, statusColor;
            if (metrics.length > 0) {
                const ultimaCaptura = normalizeMachineDate(
                    metrics[0].timestamp_captura, 
                    metrics[0].data_hora_captura
                );

                if (isNaN(ultimaCaptura.getTime())) {
                    console.error(`Data inválida para máquina ${machine.id_maquina}:`, metrics[0]);
                    statusColor = 'gray';
                    statusText = 'Dados inválidos';
                } else {
                    const diferencaSegundos = (new Date() - ultimaCaptura) / 1000;
                    const isAtivo = diferencaSegundos <= 20;

                    if (isAtivo) {
                        statusColor = 'green';
                        statusText = 'Ativo';
                        ativas++;
                    } else {
                        statusColor = 'red';
                        statusText = `Inativo (${formatBrazilianDate(ultimaCaptura)})`;
                        inativas++;
                    }
                }
            } else {
                statusColor = 'gray';
                statusText = 'Sem dados';
                inativas++;
            }

            // Contagem de alertas
            const serial = machine.serial_number;
            const alertasDaMaquina = allAlerts.filter(ticket => 
                ticket.summary?.includes(serial) || ticket.issueKey?.includes(serial)
            );
            totalAlertas += alertasDaMaquina.length;

            // Atualização da tabela (seletiva)
            const existingRow = currentRows.get(String(machine.id_maquina));
            
            if (existingRow) {
                const cells = existingRow.cells;
                
                // Atualiza apenas células modificadas
                updateCellIfChanged(cells[1], statusText);
                cells[1].style.color = statusColor;
                
                updateCellIfChanged(cells[3], alertasDaMaquina.length.toString());
                
                updateCellIfChanged(cells[2], formatTime(getMetricValue(metrics, 'uptime_hours')));
                updateCellIfChanged(cells[5], formatPercent(getMetricValue(metrics, 'ram_percent')));
                updateCellIfChanged(cells[6], formatPercent(getMetricValue(metrics, 'cpu_percent')));
                updateCellIfChanged(cells[7], formatPercent(getMetricValue(metrics, 'disk_percent')));
                
                newRows.push(existingRow);
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                    <td style="color: ${statusColor}">${statusText}</td>
                    <td>${formatTime(getMetricValue(metrics, 'uptime_hours'))}</td>
                    <td>${alertasDaMaquina.length}</td>
                    <td>${createLastAlertHTML(alertasDaMaquina)}</td>
                    <td>${formatPercent(getMetricValue(metrics, 'ram_percent'))}</td>
                    <td>${formatPercent(getMetricValue(metrics, 'cpu_percent'))}</td>
                    <td>${formatPercent(getMetricValue(metrics, 'disk_percent'))}</td>
                    <td><button class="details-btn" data-id="${machine.id_maquina}">Expandir Análise</button></td>
                `;
                newRows.push(row);
            }
        }

        // Atualização final da tabela
        const tableBody = document.querySelector('.table_body');
        
        // Remove máquinas não mais presentes
        const machineIds = machines.map(m => String(m.id_maquina));
        currentRows.forEach((row, id) => {
            if (!machineIds.includes(id)) row.remove();
        });
        
        tableBody.append(...newRows);

        // Atualiza KPIs
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[0].textContent = ativas;
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[1].textContent = inativas;
        document.getElementById('qtd_alertas').textContent = totalAlertas;

    } catch (error) {
        console.error('Erro ao carregar máquinas:', error);
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[0].textContent = '0';
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[1].textContent = '0';
        document.getElementById('qtd_alertas').textContent = '0';
    }
}

// ==============================================
// INICIALIZAÇÃO E ATUALIZAÇÃO PERIÓDICA
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona CSS para transições suaves
    const style = document.createElement('style');
    style.textContent = `
        .table_body tr { transition: all 0.3s ease; }
        .table_body td { transition: background-color 0.3s ease, color 0.3s ease; }
    `;
    document.head.appendChild(style);
    
    // Carrega dados imediatamente e a cada 10 segundos
    carregarMaquinas();
    setInterval(carregarMaquinas, 10000);
});