var express = require("express");
var router = express.Router();

var processosController = require("../controllers/processosController");

router.post('/:id_maquina', (req, res) => {
    processosController.receberProcessos(req, res)
})

router.get('/:id_maquina', (req, res) => {
    processosController.obterProcessos(req, res);
});

router.post('/matarprocesso/:id_maquina', (req, res) => {
    processosController.matarProcesso(req, res)
})


module.exports = router;