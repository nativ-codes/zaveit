import { setCurrentUser } from "@/test/fakes/auth";
import { getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  removePostService,
  savePostService,
  savePostsService,
} from "./posts.service";

const post = { id: "post-1", url: "https://example.com" } as PostType;
const otherPost = { id: "post-2", url: "https://example.org" } as PostType;

const getLists = async () => {
  const lists = await getFirestore()
    .collection("lists")
    .where("userId", "==", "user-1")
    .get();
  return lists.docs.map((list) => list.data());
};

describe("the user's cloud list", () => {
  beforeEach(() => {
    setCurrentUser({ uid: "user-1" });
  });

  describe("when it's missing", () => {
    it("is created when saving a Post", async () => {
      await savePostService(post);

      expect(await getLists()).toEqual([
        expect.objectContaining({ isPublished: false, posts: [post] }),
      ]);
    });

    it("is created when saving several Posts", async () => {
      await savePostsService([post, otherPost]);

      expect(await getLists()).toEqual([
        expect.objectContaining({ posts: [post, otherPost] }),
      ]);
    });

    it("is created when removing a Post", async () => {
      await removePostService(post);

      expect(await getLists()).toEqual([
        expect.objectContaining({ posts: [] }),
      ]);
    });
  });

  describe("when it exists", () => {
    beforeEach(async () => {
      await getFirestore()
        .collection("lists")
        .doc()
        .set({ userId: "user-1", posts: [otherPost] });
    });

    it("is reused when saving a Post", async () => {
      await savePostService(post);

      expect(await getLists()).toEqual([
        expect.objectContaining({ posts: [otherPost, post] }),
      ]);
    });

    it("is reused when saving several Posts", async () => {
      await savePostsService([post]);

      expect(await getLists()).toHaveLength(1);
    });

    it("is reused when removing a Post", async () => {
      await removePostService(otherPost);

      expect(await getLists()).toEqual([
        expect.objectContaining({ posts: [] }),
      ]);
    });
  });

  it("isn't created for a signed-out user", async () => {
    setCurrentUser(null);

    await expect(savePostService(post)).rejects.toMatchObject({
      message: "No signed-in user",
    });
    expect(await getFirestore().collection("lists").get()).toMatchObject({
      empty: true,
    });
  });
});
