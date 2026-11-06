// Deletes Thumbnails no Post refers to. Prints the keys only, unless run with --delete.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> yarn delete-orphan-thumbnails [--delete]
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { findOrphans } from "./orphans.mjs";
import { BUCKET, KEY_PREFIX, db, r2 } from "./shared.mjs";

// Lists R2 first: a Thumbnail uploaded and referenced after the List read would otherwise look orphaned
// (the 24-hour minimum age covers that too).
const objects = [];
let ContinuationToken;
do {
  const page = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: KEY_PREFIX, ContinuationToken }));
  objects.push(...(page.Contents ?? []).map(({ Key, LastModified }) => ({ key: Key, lastModified: LastModified })));
  ContinuationToken = page.NextContinuationToken;
} while (ContinuationToken);

const referenced = new Set();
for (const list of (await db.collection("lists").get()).docs) {
  for (const { thumbnailUrl } of list.data().posts ?? []) {
    if (thumbnailUrl) referenced.add(thumbnailUrl);
  }
}

const orphans = findOrphans(objects, referenced, new Date());
orphans.forEach((key) => console.log(key));

if (process.argv.includes("--delete")) {
  let failures = 0;
  for (let i = 0; i < orphans.length; i += 1000) {
    const { Errors = [] } = await r2.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: orphans.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      })
    );
    Errors.forEach(({ Key, Message }) => console.error(`could not delete ${Key}: ${Message}`));
    failures += Errors.length;
  }
  console.log(`Deleted ${orphans.length - failures} of ${objects.length} Thumbnails, ${failures} failed.`);
  process.exitCode = failures ? 1 : 0;
} else {
  console.log(`${orphans.length} of ${objects.length} Thumbnails are orphans. Rerun with --delete to delete them.`);
}
