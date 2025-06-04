var database = require("../database/config")

function matarProcesso(pid, id_maquina, tipo_comando) {
  const comandoAInserir = tipo_comando || 'encerrar_processo'; 

  var instrucaoSql = `
    INSERT INTO comandos_agente (
        id_maquina,
        pid_processo,
        tipo_comando,
        status,
        data_solicitacao
    ) VALUES (
        '${id_maquina}',
        ${pid},
        '${comandoAInserir}',
        'pendente',
        NOW()
    );
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}


module.exports = {
    matarProcesso
};