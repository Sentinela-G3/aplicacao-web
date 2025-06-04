const { buscarArquivoDoS3 } = require("../services/s3Service");

const { buscarArquivoDoS3 } = require("../../services/aws/s3Service");

async function buscarDados(req, res) {
  try {
    const conteudo = await buscarArquivoDoS3("sentinela-client", "dados.json");
    res.status(200).json(JSON.parse(conteudo));
  } catch (err) {
    console.error("Erro ao buscar no S3:", err);
    res.status(500).send("Erro ao acessar o S3");
  }
}

module.exports = {
  buscarDados
};
