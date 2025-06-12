var modeloModel = require("../models/modeloModel");

function cadastrar(req ,res){
    var nomeModelo = req.body.modeloServer;
    var idEmpresa = req.body.idEmpresaServer;

    if (nomeModelo == undefined) {
        res.status(400).send("Seu nome do modelo está undefined!");
    } else if (nomeModelo == undefined) {
        res.status(400).send("Seu idEmpresa está undefined!");
    }

     modeloModel.cadastrar(nomeModelo, idEmpresa)
                .then(
                    function (resultado) {
                        res.json(resultado);
                    }
                ).catch(
                    function (erro) {
                        console.log(erro);
                        console.log(
                            "\nHouve um erro ao realizar o cadastro! Erro: ",
                            erro.sqlMessage
                        );
                        res.status(500).json(erro.sqlMessage);
                    }
                );
}

function buscarModelos(req, res) {
  var idEmpresa = req.params.empresa

  if (idEmpresa == undefined) {
    res.status(400).send("Seu id da empresa está undefined!")
  }

  modeloModel.buscarModelos(idEmpresa)
  .then(function (resultado) {
    res.json(resultado)
  })
  .catch(function (erro) {
    console.log(erro)
    console.log("\nHouve um erro ao buscar os modelos! Erro:", erro.sqlMessage)
    res.status(500).json(erro.sqlMessage)
  })
}

function modelosComponentes(req, res) {
  var idModelo = req.params.idModelo;

  if (idModelo == undefined) {
    res.status(400).send("Seu id do modelo está undefined!");
    return; // Importante sair da função aqui para não continuar executando abaixo
  }

  if (idModelo == 1) {
    modeloModel.modelosComponentes(idModelo)
      .then(function (resultado) {
        res.json(resultado);
      })
      .catch(function (erro) {
        console.log(erro);
        console.log("\nHouve um erro ao buscar os modelos! Erro:", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
      });
  } else {
    modeloModel.modelosComponentes2(idModelo)
      .then(function (resultado) {
        res.json(resultado);
      })
      .catch(function (erro) {
        console.log(erro);
        console.log("\nHouve um erro ao buscar os modelos! Erro:", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
      });
  }
}

module.exports = {
    cadastrar,
    buscarModelos,
    modelosComponentes
}