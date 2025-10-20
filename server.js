import express from "express";
import multer from "multer";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const upload = multer();

// Use the OpenShift environment variable for bucket
const {
  S3_ENDPOINT,
  S3_REGION = "us-east-1",
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME
} = process.env;

if (!S3_BUCKET_NAME) {
  console.error("Error: S3_BUCKET_NAME is not defined in environment");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

// List objects
app.get("/api/objects", async (req, res) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME }));
    res.json(data.Contents || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Alias route
app.get("/list", async (req, res) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME }));
    res.json(data.Contents || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload object
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

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

// Download object (signed URL)
app.get("/api/download/:key", async (req, res) => {
  try {
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: req.params.key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    // redirect browser to signed URL for direct download
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Listen on all interfaces
app.listen(3000, "0.0.0.0", () => console.log("Server listening on port 3000"));
