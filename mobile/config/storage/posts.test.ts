import { setCurrentUser } from "@/test/fakes/auth";
import { documentDirectory, downloadAsync, readDirectoryAsync } from "@/test/fakes/file-system";
import { getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { setAppAuthType } from "./auth";
import { getPosts, removePost, savePost } from "./posts";

const post: PostType = {
  id: "post-1",
  url: "https://example.com/article",
  title: "An article",
  author: "example.com",
  timestamp: 1,
  tags: ["reading"],
};

const getCloudPosts = async (userId: string) => {
  const lists = await getFirestore()
    .collection("lists")
    .where("userId", "==", userId)
    .get();
  return lists.docs[0].data()?.posts;
};

describe("Posts of a signed-in user", () => {
  beforeEach(async () => {
    setCurrentUser({ uid: "user-1" });
    setAppAuthType("google");
    await getFirestore().collection("lists").doc().set({
      userId: "user-1",
      posts: [],
    });
  });

  it("saves a Post on the phone and in the cloud", async () => {
    await savePost(post);

    expect(getPosts()).toEqual([post]);
    expect(await getCloudPosts("user-1")).toEqual([post]);
  });

  it("removes a Post from the phone, its picture and the cloud", async () => {
    await savePost(post);
    await downloadAsync(post.url, `${documentDirectory}${post.id}.jpg`);

    await removePost(post);

    expect(getPosts()).toEqual([]);
    expect(await readDirectoryAsync(documentDirectory)).toEqual([]);
    expect(await getCloudPosts("user-1")).toEqual([]);
  });
});
