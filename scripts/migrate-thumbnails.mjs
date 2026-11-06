// Gives every Post without a thumbnailUrl a Thumbnail in R2. Safe to rerun: Posts with a URL are skipped.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> yarn migrate-thumbnails [--dry-run]
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";
import { downloadPicture, findSourcePicture } from "./scrape.mjs";
import { BUCKET, KEY_PREFIX, PUBLIC_BASE_URL, db, r2 } from "./shared.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 1000;
const FAILURE_LOG = `migrate-thumbnails-failures-${new Date().toISOString().replace(/[:.]/g, "-")}.log`;

const makeThumbnail = (picture) =>
  sharp(picture).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();

const uploadThumbnail = async (userId, body) => {
  const key = `${KEY_PREFIX}${userId}/${randomBytes(16).toString("hex")}.webp`;
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      // Same as the Go server: keys are never rewritten.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return PUBLIC_BASE_URL + key;
};

let added = 0;
let failed = 0;

for (const list of (await db.collection("lists").get()).docs) {
  const { userId, posts = [] } = list.data();
  if (!userId) {
    console.log(`skip ${list.id}: no userId`);
    continue;
  }
  const urls = new Map();

  for (const post of posts.filter(({ thumbnailUrl }) => !thumbnailUrl)) {
    try {
      const thumbnail = await makeThumbnail(await downloadPicture(await findSourcePicture(post.url)));
      urls.set(post.id, DRY_RUN ? "(dry run)" : await uploadThumbnail(userId, thumbnail));
      console.log(`ok   ${list.id} ${post.id} ${post.url}`);
    } catch (error) {
      failed++;
      console.log(`fail ${list.id} ${post.id} ${post.url}: ${error.message}`);
      appendFileSync(FAILURE_LOG, `${list.id}\t${post.id}\t${post.url}\t${error.message}\n`);
    }
    await sleep(DELAY_MS);
  }

  added += urls.size;
  if (DRY_RUN || !urls.size) {
    continue;
  }

  // Re-reads the List so Posts added or changed on a phone meanwhile are kept.
  // A failed write leaves this List's uploads to the orphan script and is fixed by a rerun.
  await db.runTransaction(async (transaction) => {
    const fresh = (await transaction.get(list.ref)).data()?.posts ?? [];
    transaction.update(list.ref, {
      posts: fresh.map((post) =>
        !post.thumbnailUrl && urls.has(post.id) ? { ...post, thumbnailUrl: urls.get(post.id) } : post
      ),
    });
  }).catch((error) => {
    failed += urls.size;
    added -= urls.size;
    console.log(`fail ${list.id}: writing URLs: ${error.message}`);
    appendFileSync(FAILURE_LOG, `${list.id}\t-\t-\twriting URLs: ${error.message}\n`);
  });
}

console.log(`${DRY_RUN ? "Dry run: " : ""}${added} Thumbnails added, ${failed} failed${failed ? `, see ${FAILURE_LOG}` : ""}.`);
