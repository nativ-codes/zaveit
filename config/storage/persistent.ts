import { getRandomPick, getSortedTags } from "@/screens/search/search.util";
import { savePostService } from "@/services/posts.service";
import { PostType, StoredPost } from "@/types/posts";
import { useMemo } from "react";
import { MMKV, useMMKVString } from "react-native-mmkv";

export const storage = new MMKV({
  id: "zaveit-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTON_KEY,
});

type FrequentlyAccessedPosts = Record<string, number>;

export const getPosts = (): StoredPost[] => {
  const posts = storage.getString("posts");
  return posts ? JSON.parse(posts) : [];
};

export const increasePostAccessCount = (postId: string): void => {
  const frequentlyAccessedPostsRaw = storage.getString("frequentlyAccessedPosts");
  const frequentlyAccessedPostsObject: FrequentlyAccessedPosts = frequentlyAccessedPostsRaw
    ? JSON.parse(frequentlyAccessedPostsRaw)
    : {} as FrequentlyAccessedPosts;

  frequentlyAccessedPostsObject[postId] = (frequentlyAccessedPostsObject[postId] || 0) + 1;
  storage.set("frequentlyAccessedPosts", JSON.stringify(frequentlyAccessedPostsObject));
};

export const useFrequentlyAccessedPosts = (): StoredPost[] => {
  const [frequentlyAccessedPostsRaw] = useMMKVString(
    "frequentlyAccessedPosts",
    storage
  );

  return useMemo(() => {
    const frequentlyAccessedPosts = JSON.parse(
      frequentlyAccessedPostsRaw || "{}"
    ) as FrequentlyAccessedPosts;

    const posts = getPosts();
    const frequentlyAccessedPostsIds = Object.entries(frequentlyAccessedPosts)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const filteredPosts = posts.filter((post: StoredPost) =>
      frequentlyAccessedPostsIds.includes(post.id)
    );

    return filteredPosts.sort((a: StoredPost, b: StoredPost) => {
      const aCount = frequentlyAccessedPosts[a.id] || 0;
      const bCount = frequentlyAccessedPosts[b.id] || 0;
      return bCount - aCount;
    });
  }, [frequentlyAccessedPostsRaw]);
};

export const useRecentlyAddedPosts = (): StoredPost[] => {
  const [postsRaw] = useMMKVString("posts", storage);

  return useMemo(() => {
    const posts = JSON.parse(postsRaw || "[]");

    return posts.slice(-10).reverse();
  }, [postsRaw]);
};

export const useRandomPickPost = (): StoredPost | null => {
  const posts = usePosts();

  return useMemo(() => getRandomPick(posts), []);
};

export const getTags = (): string[] => {
  const posts = getPosts();
  return getSortedTags(posts);
};

export const savePost = async (post: PostType): Promise<void> => {
  const posts = getPosts();

  posts.unshift(post);
  storage.set("posts", JSON.stringify(posts));

  await savePostService(post);
};

export const removePost = (timestamp: number): void => {
  const posts = getPosts();
  const updatedPosts = posts.filter((post) => post.timestamp !== timestamp);
  storage.set("posts", JSON.stringify(updatedPosts));
};

export const savePosts = (posts: StoredPost[]): void => {
  storage.set("posts", JSON.stringify(posts));
};

export const usePosts = (): StoredPost[] => {
  const [posts] = useMMKVString("posts", storage);

  return useMemo(() => JSON.parse(posts || "[]"), [posts]);
};
