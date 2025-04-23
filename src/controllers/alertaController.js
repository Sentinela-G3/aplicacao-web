var maquinaModel = require("../models/alertaModel");

function contarAlertasUltimaSemana(req, res) {
    const fkEmpresa = req.body.fkEmpresaServer;

    console.log("Empresa recebida para alertas da semana:", fkEmpresa);

    maquinaModel.contarAlertasUltimaSemana(fkEmpresa)
        .then((resultado) => {
            res.json(resultado[0]); 
        })
        .catch((erro) => {
            console.log("Erro ao contar alertas da semana:", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    contarAlertasUltimaSemana
}