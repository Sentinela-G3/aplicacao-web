var express = require("express");
var router = express.Router();

var medidaController = require("../controllers/medidaController");

router.get('/:id/componentes', (req, res) => {
    medidaController.obterDadosRealtime(req, res)
})


module.exports = router;