const { buscarArquivoDoS3 } = require("../services/aws/s3Service");

async function buscarDados4Anos(req, res) {
  const empresa = req.params.empresa;
  console.log("Empresa: ", empresa)
  
  const nomeArquivo = `${empresa}/${empresa}_4-anos_medias-4-anos.json`;

  try {
    const conteudo = await buscarArquivoDoS3("clientbuckets3-spt", nomeArquivo);
    res.status(200).json(JSON.parse(conteudo));
  } catch (err) {
    console.error("Erro ao buscar no S3:", err);
    res.status(404).send("Arquivo não encontrado no S3");
  }
}

module.exports = {
  buscarDados4Anos
};