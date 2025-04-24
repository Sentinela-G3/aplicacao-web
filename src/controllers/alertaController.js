var maquinaModel = require("../models/alertaModel");

function contarAlertasUltimaSemana(req, res) {
    const fkEmpresa = req.body.fkEmpresaServer;
    maquinaModel.contarAlertasUltimaSemana(fkEmpresa)
        .then((resultado) => {
            res.json(resultado[0]); 
        })
        .catch((erro) => {
            console.log("Erro ao contar alertas da semana:", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

function contarMaquinas(req, res) {
    const fkEmpresa = req.body.fkEmpresaServer;

    console.log("Empresa recebida:", fkEmpresa);

    maquinaModel.contarMaquinas(fkEmpresa)
        .then((resultado) => {
            res.json(resultado[0]); 
        })
        .catch((erro) => {
            console.log("Erro ao buscar resumo de máquinas:", erro.sqlMessage || erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}

module.exports = {
    contarAlertasUltimaSemana,
    contarMaquinas
}