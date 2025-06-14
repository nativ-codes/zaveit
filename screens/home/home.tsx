import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
  TopBar,
} from "@/common/components";
import { Spacer, TabLayout } from "@/common/layouts";
import { usePosts } from "@/config/storage/persistent";
import { useSyncLists } from "@/config/use-sync-lists";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useMemo } from "react";
import { Text } from "react-native";
import { getRandomPick } from "../search/search.util";
import styles from "./home.style";

function HomeScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const posts = usePosts();
  const { syncLists } = useSyncLists();

  useEffect(() => {
    if (hasShareIntent) {
      router.replace("/share-intent");
    }
  }, [hasShareIntent]);

  useEffect(() => {
    syncLists();
  }, []);

  // const handleLogout = async () => {
  //   try {
  //     await signOut();
  //     router.replace("/");
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  const randomPost = useMemo(() => getRandomPick(posts || []), [posts]);

  const handleOnPostPress = (postId: string) => {
    router.push({
      pathname: "/share-intent/[id]",
      params: { id: postId },
    });
  };

  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={styles.title}>Home</Text>}
          right={<Text style={styles.addPostButton}>Add Post</Text>}
        />
      </Spacer>

      <Spacer gap="s16">
        <HorizontalScrollViewPosts
          Element={PreviewPostCard}
          title="Recently Added"
          posts={posts}
          onPostPress={handleOnPostPress}
        />

        <HorizontalScrollViewPosts
          Element={PreviewPostCard}
          title="Frequently Accessed"
          posts={posts}
          onPostPress={handleOnPostPress}
        />

        {randomPost && (
          <HorizontalScrollViewPosts
            Element={PreviewPostCard}
            title="Random Pick"
            posts={[randomPost]}
            onPostPress={handleOnPostPress}
          />
        )}
      </Spacer>
    </TabLayout>
  );
}

export default HomeScreen;
