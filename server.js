import express from "express";
import multer from "multer";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const upload = multer();

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;  // <- assign individually

// Make sure TLS errors are ignored for self-signed certs (inside OCP)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: true
});

// List objects route
app.get("/list", async (req, res) => {
  if (!S3_BUCKET_NAME) {
    return res.status(500).json({ error: "S3_BUCKET_NAME is not defined" });
  }
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME }));
    res.json(data.Contents || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype
    }));
    res.json({ result: "ok", key: file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Download route
app.get("/api/download/:key", async (req, res) => {
  try {
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: req.params.key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server listening on port 3000"));
