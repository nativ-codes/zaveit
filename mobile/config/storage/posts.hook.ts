import { MAX_HORIZONTAL_SCROLLVIEW_POSTS } from "@/common/constants";
import { getRandomPick } from "@/screens/search/search.util";
import { FrequentlyAccessedPostsType, PostType } from "@/types/posts";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getPosts, subscribeToPosts } from "./posts";
import { storage } from "./storage";

// Every caller shares the same array, which changes only when the Posts do.
export const usePosts = (): PostType[] =>
  useSyncExternalStore(subscribeToPosts, getPosts);

export const useFrequentlyAccessedPosts = (): PostType[] => {
  const [frequentlyAccessedPostsRaw] = useMMKVString(
    "frequentlyAccessedPosts",
    storage
  );
  const posts = usePosts();

  return useMemo(() => {
    const frequentlyAccessedPosts = JSON.parse(
      frequentlyAccessedPostsRaw || "{}"
    ) as FrequentlyAccessedPostsType;

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
  }, [frequentlyAccessedPostsRaw, posts]);
};

export const useRecentlyAddedPosts = (): PostType[] => {
  const posts = usePosts();

  return useMemo(
    () => posts.slice(-MAX_HORIZONTAL_SCROLLVIEW_POSTS).reverse(),
    [posts]
  );
};

export const useRandomPickPost = () => {
  const posts = usePosts();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const initial = useMemo(() => getRandomPick(posts), [posts]);
  // Falls back to the initial pick if the shuffled Post was deleted.
  const post = posts.find((p) => p.id === pickedId) ?? initial;

  // Never lands on the Post already shown, unless it is the only one.
  const shuffle = () => {
    const others = posts.filter((p) => p.id !== post?.id);
    setPickedId(getRandomPick(others.length ? others : posts)?.id ?? null);
  };

  return { post, shuffle };
};

export const useHasPosts = (): boolean => usePosts().length > 0;
