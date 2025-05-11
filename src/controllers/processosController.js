const dadosProcessos = {};

function receberProcessos(req, res) {
    var idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório.' });
    }

    const payload = req.body;
    console.log("Payload recebido:", payload);

    if (!payload.timestamp || !Array.isArray(payload.processos) || payload.processos.length === 0) {
        return res.status(400).json({ erro: 'Faltam dados obrigatórios no payload ou o formato está incorreto.' });
    }

    if (!dadosProcessos[idMaquina]) {
        dadosProcessos[idMaquina] = {
            processos: [],
            pidsArmazenados: new Set() 
        };
    }

    let processosAdicionados = 0;

    payload.processos.forEach(processo => {

        if (processo.nome === 'System Idle Process' || processo.pid === 0) {
            return; 
        }

        if (!processo.timestamp || !processo.pid || !processo.nome || !processo.cpu_percent || !processo.memory_percent) {
           
           // console.log(`Processo com PID ${processo.pid} não possui dados completos e será ignorado.`);
            return;
        }

        if (dadosProcessos[idMaquina].pidsArmazenados.has(processo.pid)) {
            return;
        }

        dadosProcessos[idMaquina].processos.push(processo);
        dadosProcessos[idMaquina].pidsArmazenados.add(processo.pid);
        processosAdicionados++;
    });

    if (processosAdicionados > 0) {
        res.json({
            mensagem: `${processosAdicionados} novos processos foram recebidos e armazenados para a máquina de ID ${idMaquina}.`,
            idMaquina: idMaquina,
            dados: payload.processos
        });
    } else {
        res.json({
            mensagem: `Nenhum novo processo foi adicionado para a máquina de ID ${idMaquina}. Todos os processos já foram recebidos anteriormente ou são inválidos.`,
            idMaquina: idMaquina,
            dados: []
        });
    }
}


function obterProcessos(req, res) {
    const idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório.' });
    }

    const dados = dadosProcessos[idMaquina];

    if (!dados || dados.processos.length === 0) {
        return res.json({
            mensagem: `Sem dados para a máquina de ID ${idMaquina}, retornando valores padrão.`,
            dados: []
        });
    }

    const agrupado = {};

    dados.processos.forEach((registro) => {
        const tipo = registro.tipo;

        if (!agrupado[tipo]) {
            agrupado[tipo] = [];
        }

        agrupado[tipo].push({
            timestamp: registro.timestamp,
            pid: registro.pid,
            nome: registro.nome,
            cpu_percent: registro.cpu_percent,
            memory_percent: registro.memory_percent
        });
    });

    res.json({
        mensagem: `Dados de processos da máquina de ID ${idMaquina}`,
        dados: agrupado
    });
}

module.exports = {
    obterProcessos,
    receberProcessos
}