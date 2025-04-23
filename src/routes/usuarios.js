var express = require("express");
var router = express.Router();
const upload = require('../config/configUpload'); 

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

router.post("/buscarInformacoesPorEmail", function (req, res) {
    usuarioController.buscarInformacoesPorEmail(req, res);
});

router.post('/alterarImagem', upload.single('foto'), (req, res) => {
    usuarioController.alterarImagem(req, res);
  });

module.exports = router;