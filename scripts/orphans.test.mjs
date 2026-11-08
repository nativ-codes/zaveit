import assert from "node:assert/strict";
import { test } from "node:test";
import { findOrphans } from "./orphans.mjs";

const now = new Date("2026-11-06T12:00:00Z");
const hoursAgo = (hours) => new Date(now - hours * 3600_000);

test("deletes only unreferenced keys older than 24 hours", () => {
  const objects = [
    { key: "zaveit/u1/referenced.webp", lastModified: hoursAgo(100) },
    { key: "zaveit/u1/new.webp", lastModified: hoursAgo(100) },
    { key: "zaveit/u1/fresh.webp", lastModified: hoursAgo(23) },
    { key: "zaveit/u1/old.webp", lastModified: hoursAgo(25) },
  ];
  const referenced = new Set(["https://img.nativ.codes/zaveit/u1/referenced.webp", "https://img.zaveit.app/zaveit/u1/new.webp"]);

  assert.deepEqual(findOrphans(objects, referenced, now), ["zaveit/u1/old.webp"]);
});
