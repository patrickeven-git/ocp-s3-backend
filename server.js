import express from "express";
import multer from "multer";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const upload = multer();

const {
  S3_ENDPOINT,
  S3_REGION = "us-east-1",
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET
} = process.env;

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: true
});

app.get("/api/objects", async (req, res) => {
  const data = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET }));
  res.json(data.Contents || []);
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  }));
  res.json({ result: "ok", key: file.originalname });
});

app.get("/api/download/:key", async (req, res) => {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: req.params.key });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  res.json({ url });
});

app.listen(3000, () => console.log("listening on 3000"));
