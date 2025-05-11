var express = require("express");
var router = express.Router();

var medidaController = require("../controllers/medidaController");

router.get('/:id_maquina', (req, res) => {
    medidaController.obterDadosRealtime(req, res)
})

router.post('/:id_maquina', (req, res) => {
    medidaController.receberDadosDeMonitoramento(req, res)
})

router.get('/thresholds/:id_maquina', (req, res) => {
    medidaController.obterThreshold(req, res)
})


module.exports = router;