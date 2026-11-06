const PUBLIC_BASE_URL = "https://img.nativ.codes/";
// A share screen can upload a Thumbnail some time before its Post is saved and synced.
const MIN_AGE_MS = 24 * 3600_000;

// (R2 objects with last-modified times, every referenced thumbnailUrl, now) → keys to delete.
export const findOrphans = (objects, referencedUrls, now) =>
  objects
    .filter(({ key, lastModified }) => now - lastModified > MIN_AGE_MS && !referencedUrls.has(PUBLIC_BASE_URL + key))
    .map(({ key }) => key);
