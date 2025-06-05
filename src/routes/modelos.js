var express = require("express");
var router = express.Router();

var modeloController = require("../controllers/modeloController");

router.get("/modelosComponentes/:idModelo", function(req, res){
  modeloController.modelosComponentes(req,res)
})

router.get("/buscarModelos/:empresa", function (req, res) {
  modeloController.buscarModelos(req,res)
})

router.post("/cadastrar", function (req, res) {
    modeloController.cadastrar(req, res);
})

module.exports = router;