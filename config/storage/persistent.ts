import { MAX_HORIZONTAL_SCROLLVIEW_POSTS } from "@/common/constants";
import { deleteImage } from "@/common/utils/files";
import { getRandomPick, getSortedTags } from "@/screens/search/search.util";
import { removePostService, savePostService } from "@/services/posts.service";
import { PostType } from "@/types/posts";
import { useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getAppAuthType } from "./auth";
import { storage } from "./storage";

type FrequentlyAccessedPostsType = Record<string, number>;

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

export const useFrequentlyAccessedPosts = (): PostType[] => {
  const [frequentlyAccessedPostsRaw] = useMMKVString(
    "frequentlyAccessedPosts",
    storage
  );

  return useMemo(() => {
    const frequentlyAccessedPosts = JSON.parse(
      frequentlyAccessedPostsRaw || "{}"
    ) as FrequentlyAccessedPostsType;

    const posts = getPosts();
    const frequentlyAccessedPostsIds = Object.entries(frequentlyAccessedPosts)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, MAX_HORIZONTAL_SCROLLVIEW_POSTS)
      .map(([id]) => id);

    const filteredPosts = posts.filter((post: PostType) =>
      frequentlyAccessedPostsIds.includes(post.id)
    );

    return filteredPosts.sort((a: PostType, b: PostType) => {
      const aCount = frequentlyAccessedPosts[a.id] || 0;
      const bCount = frequentlyAccessedPosts[b.id] || 0;
      return bCount - aCount;
    });
  }, [frequentlyAccessedPostsRaw]);
};

export const useRecentlyAddedPosts = (): PostType[] => {
  const [postsRaw] = useMMKVString("posts", storage);

  return useMemo(() => {
    const posts = JSON.parse(postsRaw || "[]");

    return posts.slice(-MAX_HORIZONTAL_SCROLLVIEW_POSTS).reverse();
  }, [postsRaw]);
};

export const useRandomPickPost = (): PostType | null => {
  const posts = usePosts();

  return useMemo(() => getRandomPick(posts), [posts]);
};

export const getTags = (): string[] => {
  const posts = getPosts();
  return getSortedTags(posts);
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

export const usePosts = (): PostType[] => {
  const [posts] = useMMKVString("posts", storage);

  return useMemo(() => JSON.parse(posts || "[]"), [posts]);
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
};

export const useHasPosts = (): boolean => {
  const posts = usePosts();

  return useMemo(() => Boolean(posts.length), [posts]);
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

type PreferencesType = {
  isAnalyticsEnabled: boolean | undefined;
};

const getIsAnalyticsEnabledFromPreferences = (
  preferences: PreferencesType
): boolean => {
  return (
    preferences.isAnalyticsEnabled ||
    preferences.isAnalyticsEnabled === undefined
  );
};

export const usePreferences = (): PreferencesType => {
  const [preferencesRaw] = useMMKVString("preferences", storage);

  return useMemo(() => JSON.parse(preferencesRaw || "{}"), [preferencesRaw]);
};

export const useIsAnalyticsEnabled = (): boolean => {
  const preferences = usePreferences();

  return useMemo(
    () => getIsAnalyticsEnabledFromPreferences(preferences),
    [preferences]
  );
};

export const getPreferences = (): PreferencesType => {
  const preferencesRaw = storage.getString("preferences");
  return preferencesRaw
    ? JSON.parse(preferencesRaw)
    : { isAnalyticsEnabled: undefined };
};

export const setIsAnalyticsEnabled = (isAnalyticsEnabled: boolean): void => {
  const preferences = getPreferences();
  preferences.isAnalyticsEnabled = isAnalyticsEnabled;
  storage.set("preferences", JSON.stringify(preferences));
};

export const getIsAnalyticsEnabled = (): boolean => {
  const preferences = getPreferences();
  return getIsAnalyticsEnabledFromPreferences(preferences);
};
