var medidaModel = require("../models/medidaModel");

const dadosMonitoramento = {};

function obterDadosRealtime(req, res) {
    const idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório na URL.' });
    }

    const dados = dadosMonitoramento[idMaquina];

    if (!dados || dados.length === 0) {
        return res.json({
            mensagem: `Sem dados de monitoramento recentes para a máquina de ID ${idMaquina}. Retornando valores padrão ou vazios.`,
            dados: {}
        });
    }

    const agrupado = {};

    dados.forEach((registro) => {
        const tipo = registro.tipo;

        if (!agrupado[tipo]) {
            agrupado[tipo] = [];
        }

        agrupado[tipo].push({
            timestamp: registro.timestamp,
            valor: registro.valor
        });

        if (agrupado[tipo].length > 6) {
            agrupado[tipo] = agrupado[tipo].slice(-6);
        }
    });

    for (const tipo in agrupado) {
        agrupado[tipo] = agrupado[tipo].map((item, index) => ({
            indice: index,
            timestamp: item.timestamp,
            valor: item.valor
        }));
    }

    res.json({
        mensagem: `Dados de monitoramento da máquina de ID ${idMaquina}`,
        dados: agrupado
    });
}

function receberDadosDeMonitoramento(req, res) {
    var idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório na URL.' });
    }

    const payload = req.body;

    if (payload.timestamp === undefined ||
        payload.tipo === undefined ||
        payload.valor === undefined ||
        payload.unidade === undefined ||
        payload.serial_number === undefined) {
        return res.status(400).json({ erro: 'Faltam dados obrigatórios no payload. Campos esperados: timestamp, tipo, valor, unidade, serial_number.' });
    }

    if (typeof payload.valor !== 'number') {
        return res.status(400).json({ erro: 'O campo "valor" deve ser um tipo numérico.' });
    }

    if (!dadosMonitoramento[idMaquina]) {
        dadosMonitoramento[idMaquina] = [];
    }

    dadosMonitoramento[idMaquina].push(payload);

    res.status(200).json({
        mensagem: `Dados de monitoramento recebidos e armazenados para a máquina de ID ${idMaquina}`,
        idMaquina: idMaquina,
        dadosRecebidos: payload
    });
}

function obterInfosCPU(req, res) {
    var idUsuario = req.params.idUsuario;

    medidaModel.buscarInfoCpu(idUsuario)
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum resultado encontrado para informações de CPU.");
            }
        })
        .catch(function (erro) {
            console.error("Erro ao buscar informações de CPU:", erro);
            res.status(500).json({ erro: "Ocorreu um erro interno ao processar sua solicitação de CPU." });
        });
}

function obterThreshold(req, res) {
    let idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório na URL.' });
    }

    medidaModel.obterThreshold(idMaquina)
        .then((resultado) => {
            if (resultado && resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum threshold encontrado para esta máquina.");
            }
        })
        .catch((erro) => {
            console.error("Erro ao obter thresholds:", erro);
            res.status(500).json({ erro: "Ocorreu um erro interno ao buscar os thresholds." });
        });
}

module.exports = {
    obterInfosCPU,
    obterDadosRealtime,
    receberDadosDeMonitoramento,
    obterThreshold
};