import express from "express";
import multer from "multer";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const upload = multer();

app.use(express.static('public')); // serve public folder

const {
  S3_ENDPOINT,
  S3_REGION = "us-east-1",
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME
} = process.env;

if (!S3_BUCKET_NAME) {
  console.error("S3_BUCKET_NAME is not defined");
}

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: true
});

app.get("/api/objects", async (req, res) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME }));
    res.json(data.Contents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/download/:key", async (req, res) => {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: req.params.key });
  try {
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔑 Listen on all interfaces so OpenShift router can reach it
app.listen(3000, '0.0.0.0', () => console.log("listening on 3000"));
