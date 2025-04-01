var empresaModel = require("../models/empresaModel");

function cadastrar(req, res) {
  var nome = req.body.nomeFantasiaServer;
  var razaoSocial = req.body.razaoSocialServer;
  var cnpj = req.body.cnpjServer;
  var categoria = req.body.categoriaServer;

  console.log(nome, razaoSocial, cnpj, categoria);

  empresaModel
    .cadastrar(nome, cnpj, categoria, razaoSocial)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao realizar o cadastro! Erro: ",
        erro.sqlMessage
      );
      res.status(500).json(erro.sqlMessage);
    });
}

function validarCnpj(req, res) {
  var cnpj = req.body.validarCnpj;

  console.log("Validando CNPJ:", cnpj);

  empresaModel
    .validarCnpj(cnpj)
    .then(function (resultado) {
        if (resultado.length > 0) {
            return res.status(400).json({ mensagem: "CNPJ já cadastrado!" });
        } else {
            cadastrar(req, res);
        }
    })
    .catch(function (erro) {
        console.log("\nErro ao validar CNPJ:", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function cadastrarEndereco(req, res) {
  var logradouro = req.body.logradouroServer;
  var cep = req.body.cepServer;
  var estado = req.body.estadoServer;
  var complemento = req.body.complementoServer;
  var fkEmpresa = req.body.fkEmpresaServer;

  empresaModel
    .cadastrarEndereco(logradouro, cep, estado, complemento, fkEmpresa)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao realizar o cadastro do endereço! Erro: ",
        erro.sqlMessage
      );
      res.status(500).json(erro.sqlMessage);
    });
}

function excluirEndereco(req, res) {
  var idEndereco = req.body.enderecoServer;

  empresaModel
    .excluirEndereco(idEndereco)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao excluir o endereço! Erro: ",
        erro.sqlMessage
      );
      res.status(500).json(erro.sqlMessage);
    });
}

module.exports = {
  cadastrar,
  validarCnpj,
  cadastrarEndereco,
  excluirEndereco,
};
