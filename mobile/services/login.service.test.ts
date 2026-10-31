import { getPosts, savePosts } from "@/config/storage/posts";
import { setCurrentUser } from "@/test/fakes/auth";
import { failNextUpdate, getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { syncPosts } from "./login.service";

const makePost = (id: string, title = "A title") =>
  ({ id, url: `https://example.com/${id}`, title }) as PostType;

const getCloudPosts = async () => {
  const lists = await getFirestore()
    .collection("lists")
    .where("userId", "==", "user-1")
    .get();
  expect(lists.docs).toHaveLength(1);
  return lists.docs[0].data()?.posts as PostType[];
};

const givenCloudPosts = (posts: PostType[]) =>
  getFirestore().collection("lists").doc().set({ userId: "user-1", posts });

const ids = (posts: PostType[]) => posts.map(({ id }) => id).sort();

describe("syncPosts", () => {
  beforeEach(() => {
    setCurrentUser({ uid: "user-1" });
  });

  it("uploads an anonymous user's Posts at sign-in, creating the list", async () => {
    savePosts([makePost("local")]);

    await syncPosts();

    expect(ids(await getCloudPosts())).toEqual(["local"]);
    expect(ids(getPosts())).toEqual(["local"]);
  });

  it("merges local and cloud Posts by id, in both directions", async () => {
    savePosts([makePost("local"), makePost("both")]);
    await givenCloudPosts([makePost("cloud"), makePost("both")]);

    await syncPosts();

    expect(ids(getPosts())).toEqual(["both", "cloud", "local"]);
    expect(ids(await getCloudPosts())).toEqual(["both", "cloud", "local"]);
  });

  it("brings cloud Posts to a phone with no Posts", async () => {
    await givenCloudPosts([makePost("cloud")]);

    await syncPosts();

    expect(ids(getPosts())).toEqual(["cloud"]);
  });

  it("creates no duplicates when repeated", async () => {
    savePosts([makePost("local")]);
    await givenCloudPosts([makePost("cloud")]);

    await syncPosts();
    await syncPosts();

    expect(ids(getPosts())).toEqual(["cloud", "local"]);
    expect(ids(await getCloudPosts())).toEqual(["cloud", "local"]);
  });

  it("keeps an edited Post once, with the local edit", async () => {
    savePosts([makePost("edited", "New title")]);
    await givenCloudPosts([makePost("edited", "Old title")]);

    await syncPosts();

    expect(getPosts()).toEqual([makePost("edited", "New title")]);
    expect(await getCloudPosts()).toHaveLength(1);
  });

  it("keeps local Posts and uploads them on the next sync when a sync fails", async () => {
    savePosts([makePost("local")]);
    await givenCloudPosts([makePost("cloud")]);
    failNextUpdate();

    await expect(syncPosts()).resolves.toBe(false);

    expect(ids(getPosts())).toEqual(["local"]);
    expect(ids(await getCloudPosts())).toEqual(["cloud"]);

    await syncPosts();

    expect(ids(await getCloudPosts())).toEqual(["cloud", "local"]);
  });

  it("changes nothing for a signed-out user", async () => {
    setCurrentUser(null);
    savePosts([makePost("local")]);

    await expect(syncPosts()).resolves.toBe(false);

    expect(ids(getPosts())).toEqual(["local"]);
    expect(await getFirestore().collection("lists").get()).toMatchObject({
      empty: true,
    });
  });
});
