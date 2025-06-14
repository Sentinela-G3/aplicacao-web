module.exports = router;var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

router.post("/cadastrar", function (req, res) {
    maquinaController.cadastrar(req, res);
})

router.post("/obterFkModelo", function (req, res) {
    maquinaController.obterFkModelo(req, res);
})

router.post("/obterMaquinas", function (req, res){
    maquinaController.obterMaquinas(req, res)
})

router.get("/:idEmpresa", (req, res) => {
    maquinaController.listarMaquinasPorEmpresa(req, res)
})

router.post("/editar", function(req, res){
    maquinaController.editar(req, res)
})

router.post("/excluir", function(req, res){
    maquinaController.excluir(req, res)
})

router.post("/listarModelosDetalhados", function (req, res) {
    maquinaController.listarModelosDetalhados(req, res);
});

router.post("/quantidadeUltimaSemana", function (req, res) {
    maquinaController.contarAlertasUltimaSemana(req, res);
});

router.post("/listarTempoAtividade", function (req, res) {
    maquinaController.listarTempoAtividadePorMaquina(req, res);
});

router.get("/serial/:serialNumber", function(req, res) {
    maquinaController.obterMaquinaPorSerial(req, res);
})

router.get('/dadosModeloComponente/:modelo', function(req, res) {
    maquinaController.dadosModeloComponente(req, res)
})

router.get('/obterModelosMaquina/:idEmpresa', function(req, res) {
    maquinaController.obterModelosMaquina(req, res)
})

router.post("/obterSerialPorId", function (req, res) {
    maquinaController.obterSerialMaquinaPorId(req, res);
})

module.exports = router;
