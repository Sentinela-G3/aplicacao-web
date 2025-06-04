var processoModel = require("../models/processoModel");
const dadosProcessos = {};

function receberProcessos(req, res) {
    const idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório.' });
    }

    const payload = req.body;
    console.log("Payload recebido:", payload);

    if (!payload.timestamp || !Array.isArray(payload.processos) || payload.processos.length === 0) {
        return res.status(400).json({ erro: 'Faltam dados obrigatórios no payload ou o formato está incorreto.' });
    }

    // Inicializa se necessário
    if (!dadosProcessos[idMaquina]) {
        dadosProcessos[idMaquina] = {
            processos: [],
            pidsArmazenados: new Set()
        };
    }

    // LIMPA os dados antigos — modo "snapshot"
    dadosProcessos[idMaquina].processos = [];
    dadosProcessos[idMaquina].pidsArmazenados.clear();

    let processosAdicionados = 0;

    payload.processos.forEach(processo => {
        if (processo.nome === 'System Idle Process' || processo.pid === 0) {
            return; // Ignora processos irrelevantes
        }

        if (
            !processo.timestamp ||
            processo.pid == null ||
            !processo.nome ||
            processo.cpu_percent == null ||
            processo.memory_percent == null
        ) {
            return; // Ignora dados incompletos
        }

        dadosProcessos[idMaquina].processos.push(processo);
        dadosProcessos[idMaquina].pidsArmazenados.add(processo.pid);
        processosAdicionados++;
    });

    res.json({
        mensagem: `${processosAdicionados} processos armazenados para a máquina de ID ${idMaquina}.`,
        idMaquina: idMaquina,
        dados: dadosProcessos[idMaquina].processos
    });
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

function matarProcesso(req, res) {
    const idMaquina = req.params.id_maquina;
    const pid = req.body.pid;
    const tipo_comando = req.body.tipo_comando;

    if (!idMaquina || !pid || !tipo_comando) {
        return res.status(400).json({ erro: 'Faltam dados no payload' });
    }

    processoModel.matarProcesso(pid, idMaquina, tipo_comando)
    .then((resposta => {
        res.status(200).json({
            resposta
        })
    }))
    .catch(
        function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao realizar o encerramento do processo! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        }
    );

    
}

module.exports = {
    obterProcessos,
    receberProcessos,
    matarProcesso
}