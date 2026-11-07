import { getUniqueBy } from "@/common/utils/arrays";
import { safelyPrintError } from "@/common/utils/error-parsers";
import { deleteAllImages, deleteImage } from "@/common/utils/files";
import {
  getUserList,
  removePostService,
  savePostService,
  savePostsService,
  watchUserPosts,
} from "@/services/posts.service";
import { FrequentlyAccessedPostsType, PostType } from "@/types/posts";
import { getAuth } from "@react-native-firebase/auth";
import * as Burnt from "burnt";
import * as FileSystem from "expo-file-system/legacy";
import { ErrorHandler } from "../errors";
import { storage } from "./storage";

// Where the phone kept Posts before they were read from Firestore.
const LEGACY_POSTS_KEY = "posts";

// The signed-in user's Posts, kept current by a Firestore listener.
let posts: PostType[] = [];
let stopSnapshot: (() => void) | undefined;
const listeners = new Set<() => void>();

const setPosts = (next: PostType[]) => {
  posts = next;
  listeners.forEach((listener) => listener());
};

export const getPosts = (): PostType[] => posts;

export const subscribeToPosts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// A save that failed used to leave the Post only on the phone, so upload those once, then forget the local copy.
const uploadLegacyPosts = async () => {
  const raw = storage.getString(LEGACY_POSTS_KEY);
  if (!raw) return;

  const { posts: cloudPosts } = await getUserList();
  const cloudIds = new Set(cloudPosts.map(({ id }) => id));
  const missingFromCloud = getUniqueBy({
    array: (JSON.parse(raw) as PostType[]).filter(({ id }) => !cloudIds.has(id)),
    key: "id",
  });
  if (missingFromCloud.length) {
    await savePostsService(missingFromCloud);
  }
  storage.delete(LEGACY_POSTS_KEY);
};

// Safe to repeat. Never rejects, so callers can start it without waiting.
export const watchPosts = async (): Promise<void> => {
  const userId = getAuth().currentUser?.uid;
  if (!userId) return;

  stopWatchingPosts();
  stopSnapshot = watchUserPosts(userId, setPosts, (error) =>
    ErrorHandler.logError({ location: "watchPosts", error: safelyPrintError(error) })
  );

  try {
    await uploadLegacyPosts();
  } catch (error) {
    ErrorHandler.logError({ location: "uploadLegacyPosts", error: safelyPrintError(error) });
  }
};

export const stopWatchingPosts = () => {
  stopSnapshot?.();
  stopSnapshot = undefined;
  setPosts([]);
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

// Throws on failure, so the caller can tell the user the Post wasn't saved.
export const savePost = (post: PostType): Promise<void> => savePostService(post);

export const removePost = async (post: PostType): Promise<void> => {
  try {
    await removePostService(post);

    const frequentlyAccessedPosts = getFrequentlyAccessedPosts();
    delete frequentlyAccessedPosts[post.id];
    storage.set(
      "frequentlyAccessedPosts",
      JSON.stringify(frequentlyAccessedPosts)
    );
    // Pictures from before thumbnails moved to the server.
    deleteImage(`${FileSystem.documentDirectory}${post.id}.jpg`);
  } catch (error) {
    ErrorHandler.logError({
      location: "removePost",
      error: safelyPrintError(error),
      metadata: {
        post,
      },
    });
    Burnt.toast({ title: "Couldn't remove the Post. Try again.", preset: "error" });
  }
};

export const clearAllData = (): void => {
  storage.clearAll();
  deleteAllImages();
};
