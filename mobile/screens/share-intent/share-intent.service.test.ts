import { getPosts, stopWatchingPosts, watchPosts } from "@/config/storage/posts";
import { makeThumbnail, uploadThumbnail } from "@/services/thumbnails.service";
import { setCurrentUser } from "@/test/fakes/auth";
import { getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  getTikTokEmbedMetadata,
  parsePageTags,
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
    stopWatchingPosts();
    await watchPosts();
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

describe("Reading a page's own tags on the phone", () => {
  it("takes og:title and the og:image with entities decoded", () => {
    const html = `<head>
      <meta property="og:title" content=" A post &quot;title&quot; ">
      <meta property="og:image" content="https://cdn.example.com/a.jpg?x=1&amp;y=2" />
      <meta property="og:image" content="https://cdn.example.com/second.jpg" />
    </head>`;

    expect(parsePageTags(html, "https://www.instagram.com/p/abc/")).toEqual({
      title: 'A post "title"',
      thumbnail: "https://cdn.example.com/a.jpg?x=1&y=2",
    });
  });

  it("falls back to twitter:image and resolves a relative picture", () => {
    const html = `<meta name="twitter:image" content="/img/cover.png">`;

    expect(parsePageTags(html, "https://example.com/post/1")).toEqual({
      title: "",
      thumbnail: "https://example.com/img/cover.png",
    });
  });

  it("finds nothing on a login wall", () => {
    expect(parsePageTags("<title>Instagram</title>", "https://www.instagram.com/p/abc/")).toEqual({
      title: "",
      thumbnail: "",
    });
  });
});

describe("Reading a TikTok post", () => {
  it("takes the caption, cover and author from the video page, photo posts included", async () => {
    const state = {
      __DEFAULT_SCOPE__: {
        "webapp.video-detail": {
          itemInfo: {
            itemStruct: {
              desc: " A clip ",
              video: { cover: "https://p16.tiktokcdn.com/c.jpeg" },
              author: { nickname: "Scout", uniqueId: "scout2015" },
            },
          },
        },
      },
    };
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify(state)}</script>`
        )
      );

    const result = await getTikTokEmbedMetadata({
      url: "https://www.tiktok.com/@scout2015/photo/123",
    });

    expect(fetchMock.mock.calls[0][0]).toBe("https://www.tiktok.com/@/video/123");
    expect(result).toEqual({
      author: "Scout",
      title: "A clip",
      thumbnail: "https://p16.tiktokcdn.com/c.jpeg",
      url: "https://www.tiktok.com/@scout2015/photo/123",
    });
    fetchMock.mockRestore();
  });
});
