import { deleteAllImages, deleteImage } from "@/common/utils/files";
import { removePostService, savePostService } from "@/services/posts.service";
import { FrequentlyAccessedPostsType, PostType } from "@/types/posts";
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[Posts Service] Error saving post:", {
        error: errorMessage,
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
  const appAuthType = getAppAuthType();
  removePostById(post);
  deleteImage(post.thumbnail);

  if (appAuthType === "google" || appAuthType === "apple") {
    try {
      await removePostService(post);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[Posts Service] Error removing post:", {
        error: errorMessage,
      });
    }
  }
};

export const savePosts = (posts: PostType[]): void => {
  const previousPosts = getPosts();
  storage.set("posts", JSON.stringify([...previousPosts, ...posts]));
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
