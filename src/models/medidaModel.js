var database = require("../database/config");

function obterDadosRealtime(idMaquina) {
    var instrucaoSQL = `SELECT c.tipo, h.valor 
            FROM componente c
            JOIN (
                SELECT fk_historico_componente, MAX(data_captura) as ultima_captura
                FROM historico
                GROUP BY fk_historico_componente
            ) as ultimo ON c.id_componente = ultimo.fk_historico_componente
            JOIN historico h ON h.fk_historico_componente = ultimo.fk_historico_componente 
                          AND h.data_captura = ultimo.ultima_captura
            WHERE c.fk_componente_maquina = ${idMaquina}`;
        return database.executar(instrucaoSQL);
}
module.exports = {
    obterDadosRealtime
}
