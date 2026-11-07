import { setCurrentUser } from "@/test/fakes/auth";
import { documentDirectory, downloadAsync, readDirectoryAsync } from "@/test/fakes/file-system";
import { failNextUpdate, getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { getPosts, removePost, savePost, stopWatchingPosts, watchPosts } from "./posts";
import { storage } from "./storage";

const makePost = (id: string, title = "A title") =>
  ({ id, url: `https://example.com/${id}`, title, tags: ["reading"] }) as PostType;

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

const givenLegacyPosts = (posts: PostType[]) => storage.set("posts", JSON.stringify(posts));

const ids = (posts: PostType[]) => posts.map(({ id }) => id).sort();

beforeEach(() => {
  stopWatchingPosts();
  setCurrentUser({ uid: "user-1" });
});

describe("Posts of a signed-in user", () => {
  beforeEach(async () => {
    await givenCloudPosts([]);
    await watchPosts();
  });

  it("shows the cloud Posts and follows changes made elsewhere", async () => {
    expect(getPosts()).toEqual([]);

    await getFirestore().collection("lists").doc("doc-1").update({ posts: [makePost("cloud")] });

    expect(ids(getPosts())).toEqual(["cloud"]);
  });

  it("saves a Post in the cloud", async () => {
    await savePost(makePost("new"));

    expect(await getCloudPosts()).toEqual([makePost("new")]);
    expect(getPosts()).toEqual([makePost("new")]);
  });

  it("throws when the save fails, so the user can be told", async () => {
    failNextUpdate();

    await expect(savePost(makePost("new"))).rejects.toMatchObject({ code: "firestore/unavailable" });
    expect(getPosts()).toEqual([]);
  });

  it("removes a Post from the cloud and its old local picture", async () => {
    await savePost(makePost("gone"));
    await downloadAsync("https://example.com/gone", `${documentDirectory}gone.jpg`);

    await removePost(makePost("gone"));

    expect(getPosts()).toEqual([]);
    expect(await getCloudPosts()).toEqual([]);
    expect(await readDirectoryAsync(documentDirectory)).toEqual([]);
  });

  it("forgets the Posts when watching stops", () => {
    stopWatchingPosts();

    expect(getPosts()).toEqual([]);
  });
});

describe("Posts the phone kept before reading from the cloud", () => {
  it("are uploaded once, creating the list, then forgotten", async () => {
    givenLegacyPosts([makePost("local")]);

    await watchPosts();

    expect(ids(await getCloudPosts())).toEqual(["local"]);
    expect(ids(getPosts())).toEqual(["local"]);
    expect(storage.getString("posts")).toBeUndefined();
  });

  it("are merged by id, so a Post in both stays once with the cloud copy", async () => {
    givenLegacyPosts([makePost("local"), makePost("both", "Local title"), makePost("local")]);
    await givenCloudPosts([makePost("cloud"), makePost("both", "Cloud title")]);

    await watchPosts();

    expect(ids(await getCloudPosts())).toEqual(["both", "cloud", "local"]);
    expect(getPosts().find(({ id }) => id === "both")?.title).toBe("Cloud title");
  });

  it("are kept and uploaded on the next launch when the upload fails", async () => {
    givenLegacyPosts([makePost("local")]);
    await givenCloudPosts([makePost("cloud")]);
    failNextUpdate();

    await watchPosts();

    expect(ids(await getCloudPosts())).toEqual(["cloud"]);
    expect(storage.getString("posts")).toBeDefined();

    await watchPosts();

    expect(ids(await getCloudPosts())).toEqual(["cloud", "local"]);
  });

  it("are left alone for a signed-out user", async () => {
    setCurrentUser(null);
    givenLegacyPosts([makePost("local")]);

    await watchPosts();

    expect(storage.getString("posts")).toBeDefined();
    expect(await getFirestore().collection("lists").get()).toMatchObject({ empty: true });
  });
});
