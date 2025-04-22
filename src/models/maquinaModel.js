var database = require("../database/config");

function cadastrar(serial, setor, fkEndereco, fkModelo) {
  var instrucaoSql = `INSERT INTO maquina (serial, setor, fkEndereco, fkModelo, status) VALUES ('${serial}', '${setor}', '${fkEndereco}', '${fkModelo}', 'ativo');`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function obterFkModelo(fkEmpresa){
  var instrucaoSql = `SELECT idModelo, nomeModelo from modelo where fkEmpresa = ${fkEmpresa} and status = 'ativo';`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarModelosDetalhados(fkEmpresa) {
  var instrucaoSql = `
SELECT 
  m.modelo,
  
  (SELECT modeloComponente FROM componente 
   WHERE fkMaquina = m.idmaquina AND tipo = 'CPU' LIMIT 1) AS cpu,

  (SELECT valor FROM componente 
   WHERE fkMaquina = m.idmaquina AND tipo = 'RAM' LIMIT 1) AS ram_gb,

  (SELECT modeloComponente FROM componente 
   WHERE fkMaquina = m.idmaquina AND tipo = 'DISCO' LIMIT 1) AS disco,

  (SELECT valor FROM componente 
   WHERE fkMaquina = m.idmaquina AND tipo = 'DISCO' LIMIT 1) AS capacidade_disco_gb,

  (SELECT TIMESTAMPDIFF(DAY, MIN(h.dataCaptura), NOW())
   FROM componente c
   JOIN historico h ON h.fkComponente = c.idcomponente
   WHERE c.fkMaquina = m.idmaquina) AS dias_uso

FROM maquina m
WHERE m.fkEmpresa = 1 AND m.status = 1;
  `;

  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function obterMaquinas(fkEmpresa){
  var instrucaoSql = `SELECT maquina.* from maquina join empresa on fk_maquina_empresa = id_empresa where fk_maquina_empresa = ${fkEmpresa};`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluir(idMaquina){
  var instrucaoSql = `UPDATE maquina set status = 'desativo' where idMaquina = ${idMaquina}`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function editar(setor, fkEndereco, idMaquina){
  var instrucaoSql = `UPDATE maquina set setor = '${setor}', fkEndereco = ${fkEndereco} where idMaquina = ${idMaquina}`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = 
{ cadastrar,
  obterFkModelo,
  obterMaquinas,
  excluir,
  editar,
  listarModelosDetalhados
}
