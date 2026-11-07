import { getPosts, stopWatchingPosts, watchPosts } from "@/config/storage/posts";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import { makeThumbnail, uploadThumbnail } from "@/services/thumbnails.service";
import { setCurrentUser } from "@/test/fakes/auth";
import { getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { reloadThumbnail } from "./post-details.service";

jest.mock("@/config/app-check", () => ({}));
jest.mock("@/services/thumbnails.service");
jest.mock("@/screens/share-intent/share-intent.utils");

const oldUrl = "https://img.nativ.codes/zaveit/user-1/old.webp";
const newUrl = "https://img.nativ.codes/zaveit/user-1/new.webp";
const reloaded = { id: "reloaded", url: "https://example.com/a", title: "A", thumbnailUrl: oldUrl } as PostType;
const other = { id: "other", url: "https://example.com/b", title: "B" } as PostType;

const list = () => getFirestore().collection("lists").doc("list-1");

describe("reloadThumbnail", () => {
  beforeEach(async () => {
    setCurrentUser({ uid: "user-1" });
    await list().set({ userId: "user-1", posts: [reloaded, other] });
    stopWatchingPosts();
    await watchPosts();
    jest.mocked(getMetadata).mockResolvedValue({ thumbnail: "https://example.com/a.jpg" } as never);
    jest.mocked(makeThumbnail).mockResolvedValue("file:///cache/thumb.webp");
  });

  it("changes only that Post's URL and keeps a change made to another Post meanwhile", async () => {
    jest.mocked(uploadThumbnail).mockImplementation(async () => {
      await list().update({ posts: [reloaded, { ...other, title: "Edited elsewhere" }] });
      return newUrl;
    });

    await reloadThumbnail(reloaded);

    expect((await list().get()).data()?.posts).toEqual([
      { ...reloaded, thumbnailUrl: newUrl },
      { ...other, title: "Edited elsewhere" },
    ]);
    expect(getPosts()).toEqual([
      { ...reloaded, thumbnailUrl: newUrl },
      { ...other, title: "Edited elsewhere" },
    ]);
  });

  it("throws when the Post isn't in the cloud", async () => {
    await list().set({ userId: "user-1", posts: [other] });
    jest.mocked(uploadThumbnail).mockResolvedValue(newUrl);

    await expect(reloadThumbnail(reloaded)).rejects.toThrow("isn't in the cloud");

    expect(getPosts()).toEqual([other]);
  });

  it("throws and changes nothing when the upload fails", async () => {
    jest.mocked(uploadThumbnail).mockRejectedValue(new Error("502"));

    await expect(reloadThumbnail(reloaded)).rejects.toThrow("502");

    expect((await list().get()).data()?.posts).toEqual([reloaded, other]);
    expect(getPosts()).toEqual([reloaded, other]);
  });
});
