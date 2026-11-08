// Firestore and R2 for the hand-run Thumbnail scripts. Run with the R2 keys from server/.env
// and GOOGLE_APPLICATION_CREDENTIALS pointing at a Firebase service account file.
import { S3Client } from "@aws-sdk/client-s3";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const BUCKET = process.env.S3_BUCKET ?? "zaveit-r2";
export const PUBLIC_BASE_URL = "https://img.zaveit.app/";
export const KEY_PREFIX = "zaveit/";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_URL,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

initializeApp({ credential: applicationDefault() });
export const db = getFirestore();
