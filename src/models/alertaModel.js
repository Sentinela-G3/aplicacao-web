var database = require("../database/config");

function contarAlertasUltimaSemana(fkEmpresa) {
    const instrucaoSql = `
          select count(*) as totalUltimaSemana from alerta join empresa WHERE data_captura > CURDATE() - INTERVAL 7 DAY AND empresa.id_empresa = ${fkEmpresa};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function contarMaquinas(fkEmpresa) {
    const instrucaoSql = `
    SELECT COUNT(*)
    FROM maquina m
    JOIN componente c ON m.id_maquina = c.fk_componente_maquina AND c.tipo = 'TDA'
    WHERE NOT EXISTS (
        SELECT 1
        FROM historico h
        WHERE h.fk_historico_componente = c.id_componente AND h.valor IS NOT NULL
    )
) AS maquinas_desligadas,

    (SELECT COUNT(DISTINCT a.fk_alerta_componente)
     FROM alerta a
     JOIN maquina m ON a.fk_alerta_componente = m.id_maquina) AS maquinas_com_alertas,

    (SELECT COUNT(*)
     FROM (
         SELECT 
            m.id_maquina,
            MAX(CAST(h.valor AS DECIMAL)) AS tempo_atual,
            c.maximo AS capacidade_tda
         FROM maquina m
         JOIN componente c ON m.id_maquina = c.fk_componente_maquina AND c.tipo = 'TDA'
         JOIN historico h ON h.fk_historico_componente = c.id_componente
         GROUP BY m.id_maquina, c.maximo
     ) AS t
     WHERE t.tempo_atual >= t.capacidade_tda * 0.9
    ) AS maquinas_em_risco
    WHERE m.fk_maquina_empresa = ${fkEmpresa};
    `;
    console.log("Executando a instrução SQL para contagem de máquinas: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    contarAlertasUltimaSemana,
    contarMaquinas
}
