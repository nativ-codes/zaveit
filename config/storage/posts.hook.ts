import { MAX_HORIZONTAL_SCROLLVIEW_POSTS } from "@/common/constants";
import { getRandomPick } from "@/screens/search/search.util";
import { syncPosts } from "@/services/login.service";
import { FrequentlyAccessedPostsType, PostType } from "@/types/posts";
import auth from "@react-native-firebase/auth";
import { useEffect, useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getPosts } from "./posts";
import { storage } from "./storage";

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

export const usePosts = (): PostType[] => {
  const [posts] = useMMKVString("posts", storage);

  return useMemo(() => JSON.parse(posts || "[]"), [posts]);
};

export const useHasPosts = (): boolean => {
  const posts = usePosts();

  useEffect(() => {
    if(!posts.length) {
      const userUUID = auth()?.currentUser?.uid;
      if (userUUID) {
        syncPosts({ uid: userUUID });
      }
    }
  }, []);

  return useMemo(() => Boolean(posts.length), [posts]);
};
