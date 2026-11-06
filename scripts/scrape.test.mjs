import assert from "node:assert/strict";
import { test } from "node:test";
import { findOgImage } from "./scrape.mjs";

test("finds og:image whatever the attribute order", () => {
  assert.equal(findOgImage('<meta property="og:image" content="https://a.com/1.jpg">'), "https://a.com/1.jpg");
  assert.equal(findOgImage("<meta content='https://a.com/2.jpg' name='og:image' />"), "https://a.com/2.jpg");
});

test("falls back to twitter:image and decodes entities", () => {
  assert.equal(
    findOgImage('<meta name="twitter:image" content="https://a.com/3.jpg?a=1&amp;b=2">'),
    "https://a.com/3.jpg?a=1&b=2"
  );
});

test("finds nothing on a page without a picture", () => {
  assert.equal(findOgImage('<meta name="description" content="x">'), undefined);
});
