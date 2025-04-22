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
const b_nome_usuario = document.getElementById("nome_usuario");
b_nome_usuario.innerHTML = usuario.nomeUsuario;

 // Função para buscar dados da máquina e preencher a tabela
 async function carregarMaquinas() {
    try {
        // 1. Buscar todas as máquinas
        const response = await fetch(`http://localhost:3333/maquinas/${sessionStorage.getItem('idEmpresa')}`);
        if (!response.ok) throw new Error('Erro ao buscar máquinas');
        const machines = await response.json();

        // 2. Processar cada máquina
        const tableBody = document.querySelector('.table_body');
        tableBody.innerHTML = ''; 

        for (const machine of machines) {
            // 3. Buscar métricas mais recentes
            const metricsResponse = await fetch(`http://localhost:3333/medidas/${machine.id_maquina}/componentes`);
            if (!metricsResponse.ok) continue; 
            
            const metrics = await metricsResponse.json();
            
            // Extrair e formatar valores
            const getMetricValue = (type) => {
                const metric = metrics.find(m => m.tipo === type);
                return metric ? {
                    value: metric.valor,
                    min: metric.minimo,
                    max: metric.maximo
                } : null;
            };

            const cpu = getMetricValue('cpu_percent');
            const ram = getMetricValue('ram_percent');
            const disk = getMetricValue('disk_percent');
            const uptime = getMetricValue('uptime_hours');

            // 5. Formatar dados para exibição
            const formatTime = (hours) => {
                if (!hours || hours.value === undefined) return '-';
                const h = Math.floor(hours.value);
                const m = Math.floor((hours.value % 1) * 60);
                return `${h}:${m.toString().padStart(2, '0')}`;
            };

            const formatPercent = (metric) => {
                if (!metric || metric.value === undefined) return '-';
                return `${metric.value.toFixed(1)}%`;
            };

            const statusColor = machine.status === 1 ? 'green' : 'red';
            const statusText = machine.status === 1 ? 'Ativo' : 'Inativo';

            // 6. Criar linha da tabela
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>ID ${machine.id_maquina} (${machine.serial_number})</td>
                <td style="color: ${statusColor}">${statusText}</td>
                <td>${machine.status === 1 ? formatTime(uptime) : '-'}</td>
                <td>0</td> <!-- Alertas -->
                <td>Nenhum</td> <!-- Último Alerta -->
                <td>${machine.status === 1 ? formatPercent(ram) : '-'}</td>
                <td>${machine.status === 1 ? formatPercent(cpu) : '-'}</td>
                <td>${machine.status === 1 ? formatPercent(disk) : '-'}</td>
                <td><button class="details-btn" data-id="${machine.id_maquina}">Expandir Análise</button></td>
            `;

            tableBody.appendChild(row);
        }


    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showErrorNotification('Erro ao carregar dados das máquinas');
    }
}

// Chamando a função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarMaquinas);

