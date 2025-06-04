const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

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

module.exports = { buscarArquivoDoS3, listarArquivosPrefixo };
