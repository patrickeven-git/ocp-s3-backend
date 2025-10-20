import express from "express";
import multer from "multer";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize Express app
const app = express();
const upload = multer();

// Environment variables
const {
  S3_ENDPOINT,
  S3_REGION = "us-east-1",
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME
} = process.env;

if (!S3_BUCKET_NAME) {
  console.error("S3_BUCKET_NAME is not defined!");
  process.exit(1);
}

// Create S3 client
const s3 = new S3Client({
  endpoint: S3_ENDPOINT,         // e.g., "https://s3.openshift-storage.svc:443"
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

// Serve the public folder for GUI
app.use(express.static("public"));

// ------------------- API ROUTES ------------------- //

// List objects in bucket
app.get("/api/objects", async (req, res) => {
  try {
    const data = await s3.send(
      new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME })
    );
    res.json(data.Contents || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload a file
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
    res.json({ result: "ok", key: file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Generate signed URL for download
app.get("/api/download/:key", async (req, res) => {
  try {
    const cmd = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: req.params.key
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback route for 404
app.use((req, res) => {
  res.status(404).send("Not found");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
