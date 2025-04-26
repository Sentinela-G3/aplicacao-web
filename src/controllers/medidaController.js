var medidaModel = require("../models/medidaModel");
const dadosMonitoramento = {};
function obterDadosRealtime(req, res) {
    const idMaquina = req.params.id_maquina;

    if (!idMaquina) {
        return res.status(400).json({ erro: 'ID da máquina é obrigatório.' });
    }

    const dados = dadosMonitoramento[idMaquina];

    if (!dados || dados.length === 0) {
        return res.json({
            mensagem: `Sem dados para a máquina de ID ${idMaquina}, retornando valores padrão.`,
            dados: [0, 0, 0, 0, 0, 0]
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
        return res.status(400).json({ erro: 'ID da máquina é obrigatório.' });
    }

    const payload = req.body;

    if (!payload.timestamp || !payload.tipo || !payload.valor || !payload.unidade || !payload.serial_number) {
        return res.status(400).json({ erro: 'Faltam dados obrigatórios no payload.' });
    }

    console.log("Dados recebidos: ", payload);

    if (!dadosMonitoramento[idMaquina]) {
        dadosMonitoramento[idMaquina] = [];
    }

    dadosMonitoramento[idMaquina].push(payload);

    res.json({
        mensagem: `Dados de monitoramento recebidos e armazenados para a máquina de ID ${idMaquina}`,
        idMaquina: idMaquina,
        dados: payload
    });
}



function obterInfosCPU(req,res){
    var idUsuario = req.params.idUsuario;

    console.log("Pegando dado da CPU")

    medidaModel.buscarInfoCpu(idUsuario).then(function (resultado){
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function(erro){
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    })
}

module.exports = {
    obterInfosCPU,
    obterDadosRealtime,
    receberDadosDeMonitoramento
}