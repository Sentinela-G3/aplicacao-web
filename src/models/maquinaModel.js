var database = require("../database/config");

function cadastrar(serial, setor, fkEndereco, fkModelo) {
  var instrucaoSql = `INSERT INTO maquina (serial, setor, fkEndereco, fk_modelo, status) VALUES ('${serial}', '${setor}', '${fkEndereco}', '${fkModelo}', 'ativo');`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function obterFkModelo(fkEmpresa) {
  var instrucaoSql = `SELECT idModelo, nomeModelo from modelo where fkEmpresa = ${fkEmpresa} and status = 'ativo';`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function obterIdMaquinaPorSerial(id) {
  var instrucaoSQl = `SELECT serial_number from maquina where id_maquina = '${id}';`;
  return database.executar(instrucaoSQl);

}

function obterMaquinaPorSerial(serialNumber) {
  var instrucaoSql = `SELECT id_maquina, serial_number from maquina where serial_number = '${serialNumber}';`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarModelosDetalhados(fkEmpresa) {
  var instrucaoSql = `
SELECT
    m.fk_modelo as modelo,
        MAX(CASE WHEN c.tipo = 'cpu_percent' THEN c.modelo ELSE NULL END) AS cpu,
    MAX(CASE WHEN c.tipo = 'ram_usage_gb' THEN round(c.maximo) ELSE NULL END) AS ram_gb,
    MAX(CASE WHEN c.tipo = 'disk_usage_gb' THEN round(c.maximo) ELSE NULL END) AS capacidade_disco_gb,
    MAX(CASE WHEN c.tipo = 'uptime_hours' THEN round(c.maximo) ELSE NULL END) AS capacidade_tda
FROM
    maquina m
LEFT JOIN 
    componente c ON m.id_maquina = c.fk_componente_maquina
GROUP BY
    m.fk_modelo
ORDER BY 
    m.fk_modelo;
  `;

  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}


function listarTempoAtividadePorMaquina(fkEmpresa) {
  const instrucaoSql = `
    SELECT 
        m.serial_number as serial_number,
        m.SO as sistema_operacional,
        m.fk_modelo as modelo,
        COALESCE(
            (
                SELECT h.valor
                FROM historico h
                JOIN componente c ON h.fk_historico_componente = c.id_componente
                WHERE c.tipo = 'TDA' AND c.fk_componente_maquina = m.id_maquina
                ORDER BY h.data_captura DESC
                LIMIT 1
            ),
            NULL
        ) AS tempo_atividade
    FROM maquina m
    WHERE m.fk_maquina_empresa = ${fkEmpresa};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function obterMaquinas(fkEmpresa) {
  var instrucaoSql = `SELECT maquina.* from maquina join empresa on fk_maquina_empresa = id_empresa where fk_maquina_empresa = ${fkEmpresa};`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluir(idMaquina) {
  var instrucaoSql = `UPDATE maquina set status = 'desativo' where idMaquina = ${idMaquina}`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function editar(setor, fkEndereco, idMaquina) {
  var instrucaoSql = `UPDATE maquina set setor = '${setor}', fkEndereco = ${fkEndereco} where idMaquina = ${idMaquina}`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function dadosModeloComponente(modelo) {
  let instrucaoSql = `SELECT 
    m.id_modelo,
    m.nome AS nome_modelo,
    c_cpu.modelo AS modelo_cpu,
    c_cpu.minimo AS usoComumCpu,
    c_cpu.maximo AS usoMaximoCpu,
    c_ram.modelo AS modelo_ram,
    c_ram.minimo AS usoComumRam,
    c_ram.maximo AS usoMaximoRam,
    c_bateria.modelo AS modelo_bateria,
    c_bateria.minimo AS usoComumBateria,
    c_bateria.maximo AS usoMaximoBateria,
    c_rede.modelo AS modelo_placaRede,
    c_rede.minimo AS usoComumRede,
    c_rede.maximo AS usoMaximoRede,
    c_disco.modelo AS modelo_disco,
    c_disco.minimo AS usoComumDisco,
    c_disco.maximo AS usoMaximoDisco
FROM modelo m
JOIN componente c_cpu ON m.fk_componente_cpu = c_cpu.id_componente
JOIN componente c_ram ON m.fk_componente_ram = c_ram.id_componente
JOIN componente c_bateria ON m.fk_componente_bateria = c_bateria.id_componente
JOIN componente c_rede ON m.fk_componente_placaRede = c_rede.id_componente
JOIN componente c_disco ON m.fk_componente_disco = c_disco.id_componente
WHERE m.id_modelo = ${modelo};`;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql)
}

function obterModelosMaquina(empresa) {
  let instrucaoSql = `SELECT m.id_modelo AS idModelo,
  m.nome as nomeModelo
  FROM modelo m
  JOIN empresa id_empresa ON m.fk_empresa_modelo
  WHERE empresa =  ${empresa};`
  console.log("Executando a instrução SQL: \n" + instrucaoSql)
  return database.executar(instrucaoSql)
}

module.exports =
{
  cadastrar,
  obterFkModelo,
  obterMaquinas,
  excluir,
  editar,
  listarModelosDetalhados,
  listarTempoAtividadePorMaquina,
  obterMaquinaPorSerial,
  dadosModeloComponente,
  obterModelosMaquina,
  obterIdMaquinaPorSerial
}
