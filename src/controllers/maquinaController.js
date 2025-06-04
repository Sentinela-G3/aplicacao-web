var maquinaModel = require("../models/maquinaModel");


function cadastrar(req, res) {
  var serial = req.body.serialServer;
  var setor = req.body.setorServer;
  var fkEndereco = req.body.fkEnderecoServer;
  var fkModelo = req.body.fkModeloServer;

  maquinaModel.cadastrar(serial, setor, fkEndereco, fkModelo)
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

function obterFkModelo(req, res) {
  var fkEmpresa = req.body.fkEmpresaServer;

  maquinaModel.obterFkModelo(fkEmpresa)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao obter os modelos! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );
}

function obterMaquinas(req, res) {
  var fkEmpresa = req.body.fkEmpresaServer;

  maquinaModel.obterMaquinas(fkEmpresa)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao obter as maquinas! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );
}

function listarMaquinasPorEmpresa(req, res) {
  var idEmpresa = req.params.idEmpresa;

  maquinaModel.obterMaquinas(idEmpresa)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao obter as maquinas! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );

}

function listarModelosDetalhados(req, res) {
  var fkEmpresa = req.body.fkEmpresaServer;

  console.log("fkEmpresa:", fkEmpresa);

  maquinaModel.listarModelosDetalhados(fkEmpresa)
    .then((resultado) => {
      res.json(resultado);
    })
    .catch((erro) => {
      res.status(500).json(erro.sqlMessage);
    });
}

function listarTempoAtividadePorMaquina(req, res) {
  var fkEmpresa = req.body.fkEmpresaServer;

  maquinaModel.listarTempoAtividadePorMaquina(fkEmpresa)
    .then((resultado) => {
      res.json(resultado);
    })
    .catch((erro) => {
      res.status(500).json(erro.sqlMessage);
    });
}


function editar(req, res) {
  var setor = req.body.setorServer;
  var fkEndereco = req.body.enderecoServer;
  var idMaquina = req.body.idMaquinaServer;

  maquinaModel.editar(setor, fkEndereco, idMaquina)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao excluir a maquina! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );
}

function excluir(req, res) {
  var idMaquina = req.body.idMaquinaServer;

  maquinaModel.excluir(idMaquina)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao obter os modelo! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );
}

function obterMaquinaPorSerial(req, res) {
  var serialNumber = req.params.serialNumber;

  maquinaModel.obterMaquinaPorSerial(serialNumber)
    .then(
      function (resultado) {
        res.json(resultado);
      }
    ).catch(
      function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao obter as maquinas! Erro: ",
          erro.sqlMessage
        );
        res.status(500).json(erro.sqlMessage);
      }
    );
}

function dadosModeloComponente(req, res) {
  let modelo = req.params.modelo;

  maquinaModel.dadosModeloComponente(modelo)
    .then(
      (resultado) => { res.status(200).json(resultado) }
    ).catch(
      function (erro) {
        console.log(erro)
        console.log("\nHouve um erro ao pegar os modelos! Erro: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
      }
    )
}

function obterModelosMaquina(req, res) {
  let empresa = req.params.idEmpresa
  maquinaModel.obterModelosMaquina(empresa)
    .then((resultado) => { res.status(200).json(resultado) }
    ).catch(
      function (erro) {
        console.log(erro)
        console.log("\nHouve um erro ao pegar os modelos de maquinas! Erro: ", erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
      }
    )
}

function obterSerialMaquinaPorId(req, res) {
    var id = req.body.id;

    maquinaModel.obterIdMaquinaPorSerial(id)
        .then(function (resultado) {
            if (resultado.length === 0) {
                res.status(404).json({ mensagem: "Máquina não encontrada com o serial informado." });
            } else {
                res.status(200).json(resultado);
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log(
                "\nHouve um erro ao obter o ID da máquina! Erro: ",
                erro.sqlMessage
            );
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
  cadastrar,
  obterFkModelo,
  obterMaquinas,
  editar,
  excluir,
  listarModelosDetalhados,
  listarMaquinasPorEmpresa,
  listarTempoAtividadePorMaquina,
  obterMaquinaPorSerial,
  dadosModeloComponente,
  obterModelosMaquina,
  obterSerialMaquinaPorId
};