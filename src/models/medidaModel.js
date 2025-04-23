var database = require("../database/config");

function obterDadosRealtime(idMaquina) {
    var instrucaoSQL = `
SELECT 
    c.tipo, 
    h.valor,
    -- Retorna a data/hora completa formatada
    DATE_FORMAT(h.data_captura, '%d/%m/%Y - %H:%i:%s') as data_hora_captura,
    -- Retorna também o timestamp puro para cálculos
    h.data_captura as timestamp_captura
FROM componente c
JOIN historico h ON h.id_historico = (
    SELECT id_historico
    FROM historico 
    WHERE fk_historico_componente = c.id_componente
    ORDER BY data_captura DESC
    LIMIT 1
)
WHERE c.fk_componente_maquina = ${idMaquina}`;
    return database.executar(instrucaoSQL);
}
module.exports = {
    obterDadosRealtime
}
