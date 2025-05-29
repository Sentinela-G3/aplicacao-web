var database = require("../database/config");

function cadastrar(nome, cnpj, categoria, razaoSocial) {
  var instrucaoSql = `INSERT INTO empresa (razao_social, cnpj, categoria, data_inicio, status) VALUES ('${nome}', '${cnpj}', '${categoria}', now(), 2);`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrarEndereco(logradouro, numero, cep, estado, cidade, complemento, fkEmpresa){
  var instrucaoSql = `INSERT INTO endereco_empresa (logradouro, numero, cep, estado, cidade, complemento, fk_endereco_empresa) VALUES ('${logradouro}', '${numero}', '${cep}', '${estado}', '${cidade}', '${complemento}', ${fkEmpresa});`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluirEndereco(idEndereco){
  var instrucaoSql = `UPDATE endereco_empresa set status = 'inativo' where id_endereco = ${idEndereco};`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = { cadastrar, cadastrarEndereco, excluirEndereco };
