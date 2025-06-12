import { PreviewPostTile } from "@/common/components";
import HorizontalScrollViewPosts from "@/common/components/horizontal-scrollview-posts/horizontal-scrollview-posts";
import { Colors } from "@/common/constants/colors";
import { SafeAreaEdges } from "@/common/constants/safe-area";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { getPosts } from "@/config/storage/persistent";
import { StoredPost } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      }
      return [...prevTags, tag];
    });
  };

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

  const getTagCount = (tag: string) => {
    if (!posts || posts.length === 0) return 0;
    return posts.filter((post: StoredPost) => post.tags && post.tags.includes(tag)).length;
  };

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
        onViewAll={() => handleTagSelect(tag)}
        onPostPress={(timestamp) => {
          router.push({
            pathname: "/share-intent/[id]",
            params: { id: timestamp.toString() },
          });
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your saved content..."
          value={searchQuery}
          placeholderTextColor={Colors.text.placeholder}
          onChangeText={setSearchQuery}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const count = getTagCount(tag);
            return (
              <TouchableOpacity
                key={tag}
                activeOpacity={ACTIVE_OPACITY}
                style={[
                  styles.tagButton,
                  isSelected && styles.selectedTagButton,
                ]}
                onPress={() => handleTagSelect(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.selectedTagText,
                  ]}
                >
                  #{tag.toLowerCase()} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {availableTags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No tags found. Start adding content to see tags.
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableTags}
          renderItem={renderTagSection}
          keyExtractor={(tag) => tag}
          contentContainerStyle={styles.resultsContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  searchContainer: {
    gap: Units.s16,
    paddingTop: Units.s16,
  },
  searchInput: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.primary,
    paddingVertical: Units.s20,
    paddingHorizontal: Units.s16,
    borderRadius: Units.s24,
    marginHorizontal: Units.s16,
  },
  tagsContent: {
    paddingHorizontal: Units.s16,
    gap: Units.s8,
  },
  tagButton: {
    padding: Units.s8,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.primary,
  },
  selectedTagButton: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedTagText: {
    color: Colors.text.primary,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Units.s16,
    gap: Units.s24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Units.s16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Units.s20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: Units.s24,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Units.s8,
    textAlign: "center",
    marginBottom: Units.s32,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.primary,
    paddingHorizontal: Units.s24,
    paddingVertical: Units.s12,
    borderRadius: Units.s8,
    borderWidth: 1,
    borderColor: Colors.text.secondary,
  },
  loginButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500",
  },
});
