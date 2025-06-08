const { S3Client, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

require('dotenv').config();
const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

console.log(process.env.AWS_ACCESS_KEY_ID)
console.log(process.env.AWS_SECRET_ACCESS_KEY)
console.log(process.env.AWS_SESSION_TOKEN)
async function listarArquivosPrefixo(bucket, prefix) {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await s3.send(command);
  return response.Contents || [];
}

async function buscarArquivoDoS3(bucket, key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  const content = await response.Body.transformToString();
  return content;
}

module.exports = {
  buscarArquivoDoS3,
  listarArquivosPrefixo
};