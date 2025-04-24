var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/alertaController");

router.post("/quantidadeUltimaSemana", function (req, res) {
    maquinaController.contarAlertasUltimaSemana(req, res);
});

router.post("/quantidadeMaquinas", function (req, res) {
    maquinaController.contarMaquinas(req, res);
});

module.exports = router;