import { expect, test } from "vitest";
import { searchPosts, type VisitorPost } from "./search";

const post = (title: string, author: string, tags: string[]): VisitorPost => ({ url: "https://x", title, author, tags, timestamp: 0 });
const posts = [post("Sourdough Basics", "The Perfect Loaf", ["baking"]), post("Go patterns", "Ardan Labs", ["Programming", "go"])];

test("matches title, author and Tags, ignoring case", () => {
  expect(searchPosts(posts, "SOURDOUGH")).toEqual([posts[0]]);
  expect(searchPosts(posts, "ardan")).toEqual([posts[1]]);
  expect(searchPosts(posts, "programming")).toEqual([posts[1]]);
});

test("an empty search keeps every Post and a miss keeps none", () => {
  expect(searchPosts(posts, "  ")).toEqual(posts);
  expect(searchPosts(posts, "pasta")).toEqual([]);
});
