const express = require("express");
const router = express.Router();
const bucketController = require("../controllers/bucketController");

router.get("/dados-componente", bucketController.buscarDados);

module.exports = router;