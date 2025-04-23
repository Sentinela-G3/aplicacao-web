var medidaModel = require("../models/medidaModel");

function obterDadosRealtime(req, res) {
    var idMaquina = req.params.id;

    medidaModel.obterDadosRealtime(idMaquina)
    .then((resultado) => {
        res.status(200).json(resultado)
    })
    .catch(function(erro){
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    })



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
    obterDadosRealtime
}