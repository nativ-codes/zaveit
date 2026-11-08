// A share screen can upload a Thumbnail some time before its Post is saved and synced.
const MIN_AGE_MS = 24 * 3600_000;

// Compare by key, not URL: older Posts point at img.nativ.codes, newer ones at img.zaveit.app, same bucket.
export const keyOf = (url) => new URL(url).pathname.slice(1);

// (R2 objects with last-modified times, every referenced thumbnailUrl, now) → keys to delete.
export const findOrphans = (objects, referencedUrls, now) => {
  const referenced = new Set([...referencedUrls].map(keyOf));
  return objects
    .filter(({ key, lastModified }) => now - lastModified > MIN_AGE_MS && !referenced.has(key))
    .map(({ key }) => key);
};
