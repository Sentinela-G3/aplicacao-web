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

        console.log('Machines:', machines);
        console.log('AlertsData:', alertsData);

        const allAlerts = (alertsData.values || []).filter(ticket => 
            ticket && String(ticket.requestTypeId) === "68"
        );

        const tableBody = document.querySelector('.table_body');
        tableBody.innerHTML = ''; 

        let ativas = 0, inativas = 0, totalAlertas = 0;

        for (const machine of machines) {
            const metricsResponse = await fetch(`http://localhost:3333/medidas/${machine.id_maquina}`);
            const metrics = metricsResponse.ok ? await metricsResponse.json() : {};

            // Acessando a chave 'dados' corretamente
            const dados = metrics.dados || {};

            const getValor = (tipo) => {
                if (!dados[tipo] || dados[tipo].length === 0) return null;
                const latest = dados[tipo][dados[tipo].length - 1]; 
                return latest ? latest.valor : null;
            };

            let statusText = 'Sem dados', statusColor = 'gray';

            if (Object.keys(dados).length > 0) {
                let captureTimestamp = null;
                for (const tipo in dados) {
                    if (dados[tipo]?.length > 0) {
                        captureTimestamp = dados[tipo][dados[tipo].length - 1].timestamp;  
                        break;
                    }
                }

                if (captureTimestamp) {
                    const captura = new Date(captureTimestamp);
                    const agora = new Date();
                    const segundos = (agora - captura) / 1000;  

                    // Alterando para o critério de 10 segundos para inatividade
                    if (segundos <= 10) {
                        statusText = 'Ativo';
                        statusColor = 'green';
                        ativas++;
                    } else {
                        statusText = `Inativo (${captura.toLocaleString('pt-BR')})`;
                        statusColor = 'red';
                        inativas++;
                    }
                }
            } else {
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

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                <td style="color: ${statusColor}">${statusText}</td>
                <td>${uptime !== null ? formatarHoras(uptime) : '-'}</td>
                <td>${alertasMaquina.length}</td>
                <td>${linkUltimoAlerta}</td>
                <td>${ram !== null ? Math.round(ram) : '-'}</td>
                <td>${cpu !== null ? Math.round(cpu) : '-'}</td>
                <td>${disco !== null ? Math.round(disco) : '-'}</td>
                <td><button class="details-btn" data-id="${machine.id_maquina}">Expandir Análise</button></td>
            `;
            
            tableBody.appendChild(row);
        }

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


function formatarHoras(valor) {
    const h = Math.floor(valor);
    const m = Math.floor((valor % 1) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
}


document.addEventListener('DOMContentLoaded', () => {
    carregarMaquinas();
    setInterval(carregarMaquinas, 3000);
});
