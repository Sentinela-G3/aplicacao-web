const { buscarArquivoDoS3 } = require("../services/aws/s3Service");

async function buscarDados4Anos(req, res) {
  console.log(req)
  const empresa = req.params.empresa;
  const modelo = req.params.modelo;
  console.log("Empresa: ", empresa)
  console.log("Empresa: ", modelo)
  
  const nomeArquivo = `${empresa}/${modelo}/4-anos-media-recente.json`;
  console.log(nomeArquivo)

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