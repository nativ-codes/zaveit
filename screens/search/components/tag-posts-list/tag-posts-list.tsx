import { PreviewPostTile } from "@/common/components";
import HorizontalScrollViewPosts from "@/common/components/horizontal-scrollview-posts/horizontal-scrollview-posts";
import { getPosts } from "@/config/storage/persistent";
import { StoredPost } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { styles } from "./tag-posts-list.style";

const TagPostsList = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<StoredPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = getPosts();
        setPosts(storedPosts || []);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      }
    };
    loadPosts();
  }, []);

  const availableTags = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    const tagCounts = new Map<string, number>();
    
    posts.forEach((post: StoredPost) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([tag]) => tag);
  }, [posts]);

  const getPostsForTag = (tag: string) => {
    if (!posts || posts.length === 0) return [];
    return posts.filter((post: StoredPost) => post.tags && post.tags.includes(tag));
  };

  const renderTagSection = ({ item: tag }: { item: string }) => {
    const tagPosts = getPostsForTag(tag);
    if (tagPosts.length === 0) return null;

    return (
      <HorizontalScrollViewPosts
        title={`#${tag.toLowerCase()}`}
        posts={tagPosts}
        Element={PreviewPostTile}
        onViewAll={() => {
          router.push({
            pathname: "/view-posts",
            params: { tag }
          });
        }}
        onPostPress={(timestamp) => {
          router.push({
            pathname: "/share-intent/[id]",
            params: { id: timestamp.toString() },
          });
        }}
      />
    );
  };

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={availableTags}
      renderItem={renderTagSection}
      keyExtractor={(tag) => tag}
      contentContainerStyle={styles.resultsContainer}
    />
  );
};

export default TagPostsList; 