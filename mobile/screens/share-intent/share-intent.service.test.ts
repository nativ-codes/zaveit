import { getPosts } from "@/config/storage/posts";
import { makeThumbnail, uploadThumbnail } from "@/services/thumbnails.service";
import { setCurrentUser } from "@/test/fakes/auth";
import { getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  saveNewPost,
  startThumbnailUpload,
  THUMBNAIL_UPLOAD_TIMEOUT_MS,
} from "./share-intent.service";

jest.mock("@/config/app-check", () => ({}));
jest.mock("@/services/thumbnails.service");

const post: PostType = {
  id: "post-1",
  url: "https://example.com/article",
  title: "An article",
  author: "example.com",
  timestamp: 1,
  tags: ["reading"],
};

const thumbnailUrl = "https://img.nativ.codes/zaveit/user-1/abc.webp";

describe("Saving a new Post from the share screen", () => {
  beforeEach(async () => {
    setCurrentUser({ uid: "user-1" });
    await getFirestore().collection("lists").doc().set({
      userId: "user-1",
      posts: [],
    });
  });

  it("waits for the Thumbnail upload still in flight and saves its URL", async () => {
    let finishUpload!: (url: string) => void;
    jest.mocked(makeThumbnail).mockResolvedValue("file:///cache/thumb.webp");
    jest.mocked(uploadThumbnail).mockReturnValue(
      new Promise((resolve) => (finishUpload = resolve))
    );

    const upload = startThumbnailUpload("https://example.com/picture.jpg");
    const saving = saveNewPost(post, upload);
    await new Promise((resolve) => setImmediate(resolve)); // let every pending promise settle
    expect(getPosts()).toEqual([]);

    finishUpload(thumbnailUrl);
    await saving;

    expect(getPosts()).toEqual([{ ...post, thumbnailUrl }]);
    expect(uploadThumbnail).toHaveBeenCalledTimes(1);
  });

  it("saves the Post without a URL when the upload fails", async () => {
    jest.mocked(makeThumbnail).mockResolvedValue("file:///cache/thumb.webp");
    jest.mocked(uploadThumbnail).mockRejectedValue(new Error("413"));

    await saveNewPost(post, startThumbnailUpload("https://example.com/picture.jpg"));

    expect(getPosts()).toEqual([post]);
  });

  it("saves the Post without a URL when the upload hangs", async () => {
    jest.useFakeTimers();
    jest.mocked(makeThumbnail).mockResolvedValue("file:///cache/thumb.webp");
    jest.mocked(uploadThumbnail).mockReturnValue(new Promise(() => {}));

    const saving = saveNewPost(post, startThumbnailUpload("https://example.com/picture.jpg"));
    await jest.advanceTimersByTimeAsync(THUMBNAIL_UPLOAD_TIMEOUT_MS);
    await saving;
    jest.useRealTimers();

    expect(getPosts()).toEqual([post]);
  });
});
