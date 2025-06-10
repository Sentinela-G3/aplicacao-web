// var database = require("../database/config");

// function obterQtdTotal(empresa) {
//     // CORREÇÃO: Removido o ponto e vírgula e corrigido o alias no WHERE
//     let instrucaoSql = `
// SELECT
//   (SELECT COUNT(DISTINCT m.id_maquina)
//    FROM maquina m
//    JOIN componente c ON c.fk_componente_maquina = m.id_maquina
//    JOIN alerta a ON a.fk_alerta_componente = c.id_componente
//    WHERE m.fk_maquina_empresa = ${empresa}
//   ) AS qtd_maquinas_com_alerta,

//   (SELECT COUNT(*) 
//    FROM maquina m 
//    WHERE m.fk_maquina_empresa = ${empresa}
//   ) AS qtd_maquinas;

//     `;
//     console.log("Executando a instrução SQL: \n" + instrucaoSql);
//     return database.executar(instrucaoSql);
// }

// function obterQtdComAlertas(empresa) {
//     // CORREÇÃO: Removido o ponto e vírgula e corrigido o alias no WHERE
//     let instrucaoSql = `
//         SELECT COUNT(DISTINCT m.id_maquina) AS qtd_maquinas_com_alerta 
//         FROM maquina m
//         JOIN componente c ON c.fk_componente_maquina = m.id_maquina
//         JOIN alerta a ON a.fk_alerta_componente = c.id_componente
//         WHERE m.fk_maquina_empresa = ${empresa};
//     `;
//     console.log("Executando a instrução SQL: \n" + instrucaoSql);
//     return database.executar(instrucaoSql);
// }

// module.exports = {
//     obterQtdTotal,
//     obterQtdComAlertas
// };