import { PreviewPost } from "@/common/components";
import { SafeAreaEdges } from "@/common/constants/safe-area";
import { Units } from "@/common/constants/units";
import { getPosts } from "@/config/storage/persistent";
import { StoredPost } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./view-posts.style";
import { ViewPostsTypeEnum } from "./view-posts.type";

export default function ViewPostsScreen() {
  const { type, tag } = useLocalSearchParams<{ type: ViewPostsTypeEnum; tag?: string }>();
  const router = useRouter();
  const [posts, setPosts] = useState<StoredPost[]>([]);

  useEffect(() => {
    const storedPosts = getPosts();
    setPosts(storedPosts);
  }, []);

  const filteredPosts = useMemo(() => {
    if (!tag) return posts;
    return posts.filter(post => post.tags.includes(tag));
  }, [posts, tag]);

  const getTitle = () => {
    if (tag) {
      return `Posts tagged with "${tag}"`;
    }
    switch (type) {
      case ViewPostsTypeEnum.RECENTLY_ADDED:
        return "Recently Added Posts";
      case ViewPostsTypeEnum.FREQUENTLY_ACCESSED:
        return "Frequently Accessed Posts";
      default:
        return "All Posts";
    }
  };

  const renderItem = ({ item: post }: { item: StoredPost }) => (
    <PreviewPost
      key={post.id}
      url={post.url}
      title={post.title}
      thumbnail={post.thumbnail}
      tags={post.tags}
      onPress={() =>
        router.push({
          pathname: "/share-intent/[id]",
          params: { id: post.id },
        })
      }
    />
  );

  return (
    <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ItemSeparatorComponent={() => <View style={{ height: Units.s16 }} />}
      />
    </SafeAreaView>
  );
}

export const options = {
  headerShown: false,
}; 