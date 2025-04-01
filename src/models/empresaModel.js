var database = require("../database/config");

function cadastrar(nome, cnpj, categoria, razaoSocial) {
  var instrucaoSql = `INSERT INTO empresa (nomeFantasia, cnpj, categoria, dataInicio, status) VALUES ('${nome}', '${cnpj}', '${categoria}', now(), 1);`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function validarCnpj(cnpj) {
  var instrucaoSql = `SELECT * FROM empresa WHERE cnpj = '${cnpj}'`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrarEndereco(logradouro, cep, estado, complemento, fkEmpresa) {
  var instrucaoSql = `INSERT INTO endereco (logradouro, cep, estado, complemento, fkEmpresa) VALUES ('${logradouro}', '${cep}', '${estado}', '${complemento}', ${fkEmpresa});`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluirEndereco(idEndereco) {
  var instrucaoSql = `UPDATE endereco set status = 'inativo' where idEndereco = ${idEndereco};`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = { cadastrar, validarCnpj, cadastrarEndereco, excluirEndereco };
