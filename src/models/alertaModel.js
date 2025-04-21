var database = require("../database/config");

function contarAlertasUltimaSemana(fkEmpresa) {
    const instrucaoSql = `
                SELECT COUNT(*) AS totalUltimaSemana 
          FROM alerta 
          JOIN maquina
          WHERE dataCaptura > CURDATE() - INTERVAL 7 DAY
          AND maquina.fkEmpresa = ${fkEmpresa};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
  }
  
  module.exports = { 
  contarAlertasUltimaSemana
}
