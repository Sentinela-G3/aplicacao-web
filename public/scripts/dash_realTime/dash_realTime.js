// Verificando sessão do usuário
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

// Plotando nome no menu lateral
document.getElementById("nome_usuario").innerHTML = usuario.nomeUsuario;

// Formatadores
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

async function carregarMaquinas() {
    try {
        
        const [machinesResponse, alertsResponse] = await Promise.all([
            fetch(`http://localhost:3333/maquinas/${usuario.idEmpresa}`),
            fetch('http://localhost:3333/jira/tickets')
        ]);

        if (!machinesResponse.ok) throw new Error('Erro ao buscar máquinas');
        if (!alertsResponse.ok) throw new Error('Erro ao buscar alertas');

        const [machines, alertsData] = await Promise.all([
            machinesResponse.json(),
            alertsResponse.json()
        ]);

     
        const allAlerts = (alertsData.values || []).filter(ticket => 
            ticket && String(ticket.requestTypeId) === "68"
        );

        // 3. Inicializa contadores
        let ativas = 0;
        let inativas = 0;
        let totalAlertas = 0;
        const tableBody = document.querySelector('.table_body');
        tableBody.innerHTML = '';

        // 4. Processa cada máquina
        for (const machine of machines) {
            const metricsResponse = await fetch(`http://localhost:3333/medidas/${machine.id_maquina}/componentes`);
            const metrics = metricsResponse.ok ? await metricsResponse.json() : [];

            let statusText, statusColor;
            if (metrics.length > 0) {
                const ultimaCaptura = new Date(metrics[0].timestamp_captura);
                const diferencaSegundos = (new Date() - ultimaCaptura) / 1000;
                const isAtivo = diferencaSegundos <= 10;

                if (isAtivo) {
                    statusColor = 'green';
                    statusText = 'Ativo';
                    ativas++;
                } else {
                    statusColor = 'red';
                    statusText = `Inativo (${metrics[0].data_hora_captura})`;
                    inativas++;
                }
            } else {
                statusColor = 'gray';
                statusText = 'Sem dados';
                inativas++;
            }

            // Conta alertas específicos desta máquina
            const serial = machine.serial_number;
            const alertasDaMaquina = allAlerts.filter(ticket => 
                ticket.summary?.includes(serial) || ticket.issueKey?.includes(serial)
            );
            const qtdAlertas = alertasDaMaquina.length;
            totalAlertas += qtdAlertas;

            // Obtém métricas
            const getMetricValue = (type) => {
                const metric = metrics.find(m => m.tipo === type);
                return metric ? {
                    value: metric.valor,
                    min: metric.minimo,
                    max: metric.maximo
                } : null;
            };

            // Encontra e formata o último alerta
            let ultimoAlertaHTML = 'Nenhum';
            if (alertasDaMaquina.length > 0) {
                const ultimoAlerta = alertasDaMaquina.reduce((latest, alerta) => {
                    const alertDate = new Date(alerta.createdDate?.iso8601 || 0);
                    const latestDate = new Date(latest.createdDate?.iso8601 || 0);
                    return alertDate > latestDate ? alerta : latest;
                });

                const dataFormatada = new Date(ultimoAlerta.createdDate.iso8601).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                ultimoAlertaHTML = `
                    <a href="${ultimoAlerta._links.web}" 
                       target="_blank" 
                       style="color: #dc3545; text-decoration: none; font-weight: 500;"
                       title="Abrir chamado no Jira">
                       ${dataFormatada} (${ultimoAlerta.issueKey})
                    </a>
                `;
            }

            // Cria linha da tabela
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                <td style="color: ${statusColor}">${statusText}</td>
                <td>${formatTime(getMetricValue('uptime_hours'))}</td>
                <td>${qtdAlertas}</td>
                <td>${ultimoAlertaHTML}</td>
                <td>${formatPercent(getMetricValue('ram_percent'))}</td>
                <td>${formatPercent(getMetricValue('cpu_percent'))}</td>
                <td>${formatPercent(getMetricValue('disk_percent'))}</td>
                <td><button class="details-btn" data-id="${machine.id_maquina}">Expandir Análise</button></td>
            `;
            tableBody.appendChild(row);
        }

        // 5. Atualiza KPIs
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[0].textContent = ativas;
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[1].textContent = inativas;
        document.getElementById('qtd_alertas').textContent = totalAlertas;

    } catch (error) {
        console.error('Erro ao carregar máquinas:', error);
        showErrorNotification('Falha ao carregar dados das máquinas');
        
        // Reseta KPIs
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[0].textContent = '0';
        document.querySelectorAll('.kpi_maqRT2 span:nth-child(2)')[1].textContent = '0';
        document.getElementById('qtd_alertas').textContent = '0';
    }
}

function showErrorNotification(message) {
    console.error('Notificação de erro:', message);

}

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', carregarMaquinas);

// Atualiza a cada 5 segundos
setInterval(carregarMaquinas, 5000);