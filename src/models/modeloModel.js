var database = require("../database/config")

function cadastrar(modelo, idEmpresa) {
  console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", modelo, idEmpresa)
  var instrucaoSql = `
           INSERT INTO modelo (nomeModelo, fkEmpresa, status) values ('${modelo}', ${idEmpresa}, 'ativo');
        `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarModelos(idEmpresa) {
  console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", idEmpresa)

  var instrucaoSql = `SELECT id_modelo, nome FROM modelo JOIN maquina ON id_modelo = modelo WHERE fk_maquina_empresa = ${idEmpresa} group by id_modelo;`
  console.log("Executando a instrução SQL: \n" + instrucaoSql)
  return database.executar(instrucaoSql)
}

function modelosComponentes(idModelo) {
  console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", idModelo)

  var instrucaoSql = `SELECT DISTINCT 
    c.tipo,
    c.modelo,
    c.valor,
    c.minimo,
    c.maximo,
    c.unidade_medida
FROM componente c
JOIN maquina ma ON c.fk_componente_maquina = ma.id_maquina
WHERE ma.fk_modelo = ${idModelo} AND c.tipo IN ('cpu_percent', 'ram_percent', 'net_usage', 'disk_percent', 'battery_percent');`
  console.log("Executando a instrução SQL: \n" + instrucaoSql)
  return database.executar(instrucaoSql)
}

function modelosComponentes2(idModelo) {
  console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", idModelo)

  var instrucaoSql = `SELECT DISTINCT 
    c.tipo,
    c.modelo,
    c.valor,
    c.minimo,
    c.maximo,
    c.unidade_medida
FROM componente c
JOIN maquina ma ON c.fk_componente_maquina = ma.id_maquina
WHERE ma.fk_modelo = ${idModelo} AND c.tipo IN ('cpu_percent', 'ram_percent', 'net_usage', 'disk_percent');`
  console.log("Executando a instrução SQL: \n" + instrucaoSql)
  return database.executar(instrucaoSql)
}


module.exports = {
  cadastrar,
  buscarModelos,
  modelosComponentes,
  modelosComponentes2
};