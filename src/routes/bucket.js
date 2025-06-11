const express = require("express");
const router = express.Router();
const bucketController = require("../controllers/bucketController");

router.get('/dados/:empresa/:modelo', bucketController.buscarDados4Anos);

module.exports = router;