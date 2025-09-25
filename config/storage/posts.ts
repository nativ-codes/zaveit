import { getUniqueBy } from "@/common/utils/arrays";
import { safelyPrintError } from "@/common/utils/error-parsers";
import { deleteAllImages, deleteImage } from "@/common/utils/files";
import { removePostService, savePostService } from "@/services/posts.service";
import { FrequentlyAccessedPostsType, PostType } from "@/types/posts";
import * as FileSystem from "expo-file-system";
import { ErrorHandler } from "../errors";
import { getAppAuthType } from "./auth";
import { storage } from "./storage";

export const getPosts = (): PostType[] => {
  const posts = storage.getString("posts");
  return posts ? JSON.parse(posts) : [];
};

export const getFrequentlyAccessedPosts = (): FrequentlyAccessedPostsType => {
  const frequentlyAccessedPostsRaw = storage.getString(
    "frequentlyAccessedPosts"
  );
  return frequentlyAccessedPostsRaw
    ? JSON.parse(frequentlyAccessedPostsRaw)
    : {};
};

export const increasePostAccessCount = (postId: string): void => {
  const frequentlyAccessedPostsObject = getFrequentlyAccessedPosts();

  frequentlyAccessedPostsObject[postId] =
    (frequentlyAccessedPostsObject[postId] || 0) + 1;
  storage.set(
    "frequentlyAccessedPosts",
    JSON.stringify(frequentlyAccessedPostsObject)
  );
};

export const savePost = async (post: PostType): Promise<void> => {
  const posts = getPosts();
  const appAuthType = getAppAuthType();

  posts.push(post);
  storage.set("posts", JSON.stringify(posts));

  if (appAuthType === "google" || appAuthType === "apple") {
    try {
      await savePostService(post);
    } catch (error) {
      ErrorHandler.logError({
        location: "savePost",
        error: safelyPrintError(error),
        metadata: {
          post,
        },
      });
    }
  }
};

export const updatePost = async (post: PostType): Promise<void> => {
  const posts = getPosts();

  const updatedPosts = posts.map((p) => (p.id === post.id ? post : p));
  storage.set("posts", JSON.stringify(updatedPosts));
};

export const removePost = async (post: PostType): Promise<void> => {
  try {
    const appAuthType = getAppAuthType();
    removePostById(post);
    deleteImage(`${FileSystem.documentDirectory}${post.id}.jpg`);

    if (appAuthType === "google" || appAuthType === "apple") {
      try {
        await removePostService(post);
      } catch (error) {
        ErrorHandler.logError({
          location: "removePostAppAuthService",
          error: safelyPrintError(error),
          metadata: {
            post,
          },
        });
      }
    }
  } catch (error) {
    ErrorHandler.logError({
      location: "removePost",
      error: safelyPrintError(error),
      metadata: {
        post,
      },
    });
  }
};

export const savePosts = (posts: PostType[]): void => {
  const previousPosts = getPosts();

  const uniquePosts = getUniqueBy({
    array: [...previousPosts, ...posts],
    key: "id",
  });

  storage.set("posts", JSON.stringify(uniquePosts));
};

export const removePostById = (post: PostType): void => {
  const posts = getPosts();
  const updatedPosts = posts.filter(
    (currentPost) => currentPost.id !== post.id
  );

  const frequentlyAccessedPosts = getFrequentlyAccessedPosts();
  delete frequentlyAccessedPosts[post.id];
  storage.set(
    "frequentlyAccessedPosts",
    JSON.stringify(frequentlyAccessedPosts)
  );

  storage.set("posts", JSON.stringify(updatedPosts));
};

export const clearAllData = (): void => {
  storage.clearAll();
  deleteAllImages();
};

export const removeDuplicatePosts = (): void => {
  const posts = getPosts();
  if (posts.length === 0) {
    storage.set("posts", JSON.stringify([]));
  }

  const idToPost = new Map<string, PostType>();

  for (const post of posts) {
    const existing = idToPost.get(post.id);
    if (!existing) {
      idToPost.set(post.id, post);
      continue;
    }
  }

  const deduplicatedPosts = Array.from(idToPost.values());
  storage.set("posts", JSON.stringify(deduplicatedPosts));
};
