var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.get("/:idUsuario", function (req, res) {
    usuarioController.buscarPorId(req, res)
})

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/listarPorEmpresa/:fkEmpresa", function (req, res) {
    usuarioController.listarPorEmpresa(req, res);
})

router.delete("/:idFuncionario", function (req, res) {
    usuarioController.deletar(req, res);
})

router.put("/:idFuncionario", function (req, res) {
    usuarioController.atualizar(req, res)
})

module.exports = router;