# ocp-s3-backend
Use OpenShift Data Foundation (ODF)/NooBaa object store → create an ObjectBucketClaim (OBC). OBC creates the bucket + an application account (access key + secret) and exposes them as a Secret/ConfigMap in your app namespace. 
Red Hat Docs
+1

Don’t put object keys directly into browser JS. Run a small backend service (Node.js/Express) which reads the S3 credentials from the OBC Secret and:

lists objects

returns presigned download URLs or streams objects to the client

accepts uploads (multipart) and PUTs to S3 or issues presigned upload URLs

Frontend (React) calls backend endpoints to list/upload/download and shows a GUI (like Dropbox).

IBM Storage Fusion / Fusion Backup & Restore can target S3-compatible object stores (S3-compatible endpoint). Use a dedicated bucket/backup location (don’t put backups in same storage you protect)
