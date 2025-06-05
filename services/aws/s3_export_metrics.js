// services/aws/s3_export_metrics.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mysql from 'mysql2/promise'; // Importa o cliente MySQL com suporte a Promises
import dotenv from 'dotenv';
import fs from 'fs/promises'; // Módulo para manipulação de sistema de arquivos (com Promises)
import path from 'path'; // Módulo para lidar com caminhos de arquivo

dotenv.config();

// --- Configurações do Banco de Dados ---
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};

// --- Configurações do S3 ---
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- Diretório para salvar arquivos localmente ---
const LOCAL_EXPORTS_DIR = path.join(process.cwd(), 'exports_locais');

/**
 * Salva o conteúdo (JSON ou outro texto) localmente em um subdiretório.
 * @param {string} subPath - O caminho relativo do arquivo dentro de LOCAL_EXPORTS_DIR (ex: 'NomeEmpresa/arquivo.json').
 * @param {string} content - O conteúdo a ser salvo (string JSON).
 */
async function saveLocalCopy(subPath, content) {
    try {
        const fullDirPath = path.join(LOCAL_EXPORTS_DIR, path.dirname(subPath));
        await fs.mkdir(fullDirPath, { recursive: true }); // Garante que o diretório da empresa exista
        const filePath = path.join(LOCAL_EXPORTS_DIR, subPath);
        await fs.writeFile(filePath, content);
        console.log(`✅ Cópia local salva em: ${filePath}`);
    } catch (error) {
        console.error(`❌ Erro ao salvar cópia local para ${subPath}:`, error);
    }
}

/**
 * Exporta dados históricos de métricas (no formato JSON) para um arquivo no S3.
 * Tenta salvar no S3 e, em caso de sucesso, salva localmente também.
 * Em caso de falha no S3, salva localmente como fallback.
 *
 * Esta função agora percorre todas as empresas e gera um arquivo por empresa para a data especificada.
 *
 * @param {string} dateString - A data no formato 'YYYY-MM-DD' para filtrar os dados.
 * @returns {Promise<Object>} Um objeto com o status da operação para cada empresa.
 */
export async function exportMetricsJsonToS3(dateString) { // serialNumber foi removido
    let connection;
    const exportResults = []; 

    try {
        connection = await mysql.createConnection(dbConfig);

        // Validação básica da data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw new Error("Formato de data inválido. Use YYYY-MM-DD.");
        }

        // 1. Obter todas as empresas
        const [companies] = await connection.execute("SELECT id_empresa, razao_social FROM empresa");

        if (companies.length === 0) {
            console.warn("Nenhuma empresa encontrada no banco de dados.");
            return { message: "Nenhuma empresa encontrada para exportar.", results: [] };
        }

        // Iterar sobre cada empresa
        for (const company of companies) {
            const companyId = company.id_empresa;
            const companyNameSanitized = company.razao_social.replace(/[^a-zA-Z0-9_]/g, '_'); 

            let fileUrl = null;
            let jsonContentString = '';
            let fileName = '';
            let localFilePath = null; 

            try {
                // 2. Buscar todos os dados históricos para as máquinas desta empresa na data fornecida
                const query = `
                    SELECT
                        h.id_historico AS indice,
                        h.data_captura AS timestamp,
                        h.valor,
                        c.tipo,
                        mq.serial_number,
                        mdl.nome AS modelo_maquina,
                        e.razao_social AS empresa_nome -- Alias para o nome da empresa
                    FROM
                        historico AS h
                    JOIN
                        componente AS c ON h.fk_historico_componente = c.id_componente
                    JOIN
                        maquina AS mq ON c.fk_componente_maquina = mq.id_maquina
                    LEFT JOIN
                        modelo AS mdl ON mq.modelo = mdl.id_modelo
                    LEFT JOIN
                        empresa AS e ON mq.fk_maquina_empresa = e.id_empresa
                    WHERE
                        DATE(h.data_captura) = ? AND e.id_empresa = ?
                    ORDER BY
                        c.tipo, h.data_captura;
                `;
                const [rows] = await connection.execute(query, [dateString, companyId]);

                if (rows.length === 0) {
                    console.warn(`Nenhum dado encontrado para a empresa '${company.razao_social}' na data ${dateString}.`);
                    exportResults.push({ company: company.razao_social, status: "Nenhum dado encontrado" });
                    continue; // Pula para a próxima empresa
                }

                // 3. Estruturar os dados no formato JSON desejado (agrupados por tipo)
                const structuredData = {
                    dados: {}
                };

                rows.forEach(row => {
                    const { tipo, indice, timestamp, valor, empresa_nome, modelo_maquina, serial_number } = row;

                    if (!structuredData.dados[tipo]) {
                        structuredData.dados[tipo] = [];
                    }

                    structuredData.dados[tipo].push({
                        indice: indice,
                        timestamp: timestamp ? new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ') : null,
                        valor: valor,
                        empresa: empresa_nome || "N/A",
                        modelo: modelo_maquina || "N/A",
                        serial_number: serial_number // Inclui o serial_number da máquina no JSON
                    });
                });

                jsonContentString = JSON.stringify(structuredData, null, 2);

                // 4. Gerar nome de arquivo e chave S3 (com pasta da empresa)
                fileName = `${companyNameSanitized}-${dateString}.json`;
                const s3Key = `${companyNameSanitized}/${fileName}`; // Caminho S3 com pasta da empresa

                // Tentar upload para o S3
                try {
                    const uploadParams = {
                        Bucket: S3_BUCKET_NAME,
                        Key: s3Key, // Usar a chave S3 com a pasta
                        Body: jsonContentString,
                        ContentType: 'application/json',
                    };

                    const command = new PutObjectCommand(uploadParams);
                    await s3Client.send(command);

                    fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
                    console.log(`✅ Dados de métricas para '${company.razao_social}' exportados para S3: ${fileUrl}`);

                    // Salvar uma cópia local também (na pasta da empresa)
                    await saveLocalCopy(path.join(companyNameSanitized, fileName), jsonContentString);
                    localFilePath = path.join(LOCAL_EXPORTS_DIR, companyNameSanitized, fileName);
                    exportResults.push({ company: company.razao_social, status: "Sucesso", fileUrl: fileUrl, localPath: localFilePath });

                } catch (s3Error) {
                    console.error(`❌ Erro ao exportar para S3 para '${company.razao_social}'. Tentando salvar localmente como fallback:`, s3Error);
                    // Em caso de falha no S3, salva localmente como fallback
                    await saveLocalCopy(path.join(companyNameSanitized, fileName), jsonContentString);
                    localFilePath = path.join(LOCAL_EXPORTS_DIR, companyNameSanitized, fileName);
                    exportResults.push({ company: company.razao_social, status: "Falha S3, salvo localmente", localPath: localFilePath });
                }

            } catch (companyError) {
                console.error(`❌ Erro ao processar empresa '${company.razao_social}':`, companyError);
                exportResults.push({ company: company.razao_social, status: `Erro: ${companyError.message}` });
            }
        }
        return { message: "Processo de exportação concluído para todas as empresas.", results: exportResults };

    } catch (error) {
        console.error(`❌ Erro geral no processo de exportação:`, error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
