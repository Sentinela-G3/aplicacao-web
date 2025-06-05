const express = require("express");
const router = express.Router();
const bucketController = require("../controllers/bucketController");

router.get("/dados-componente", bucketController.buscarDados);
/*
const s3Service = require("../../services/aws/s3_export_metrics")

router.get("/dados-componente", bucketController.buscarDados);

router.get('/exportar', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Os parâmetros "date" são obrigatórios para exportação de métricas JSON.' });
    }

    try {
        const result = await s3Service.exportMetricsJsonToS3(date);
        res.status(200).json(result);
    } catch (error) {
        console.error('Erro na rota de exportação de métricas JSON:', error);
        res.status(500).json({
            message: `Erro interno do servidor ao exportar métricas para a máquina ${serialNumber} na data ${date}: ${error.message}`,
            error: error.message,
        });
    }
});*/

module.exports = router;