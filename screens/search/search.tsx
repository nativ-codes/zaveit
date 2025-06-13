import { PreviewPost } from "@/common/components";
import { Colors } from "@/common/constants/colors";
import { SafeAreaEdges } from "@/common/constants/safe-area";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { GeneralStyles } from "@/common/styles";
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
import TagPostsList from "./components/tag-posts-list/tag-posts-list";

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

  const getTagCount = (tag: string) => {
    if (!posts || posts.length === 0) return 0;
    return posts.filter((post: StoredPost) => post.tags && post.tags.includes(tag)).length;
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    // Filter by search query if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => 
        (post.title?.toLowerCase().includes(query) ?? false) ||
        post.url.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected tags if any
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => 
        selectedTags.every(tag => post.tags && post.tags.includes(tag))
      );
    }
    
    return filtered;
  }, [posts, selectedTags, searchQuery]);

  const availableTags = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    const tagCounts = new Map<string, number>();
    const postsToConsider = filteredPosts;
    
    postsToConsider.forEach((post: StoredPost) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([tag]) => tag);
  }, [posts, filteredPosts]);

  const renderFilteredPost = ({ item: post }: { item: StoredPost }) => (
    <PreviewPost
      {...post}
      onPress={() => {
        router.push({
          pathname: "/share-intent/[id]",
          params: { id: post.id },
        });
      }}
    />
  );

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your saved content..."
            value={searchQuery}
            placeholderTextColor={Colors.text.placeholder}
            onChangeText={setSearchQuery}
          />
        </View>
      
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
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
                  style={[styles.tagText, isSelected && styles.selectedTagText]}
                >
                  #{tag.toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedTags.length > 0 || searchQuery.trim() ? (
        <View style={styles.filteredSection}>

          <FlatList
            data={filteredPosts}
            renderItem={renderFilteredPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filteredContent}
            ItemSeparatorComponent={() => (
              <View style={{ height: Units.s16 }} />
            )}
          />
        </View>
      ) : availableTags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No tags found. Start adding content to see tags.
          </Text>
        </View>
      ) : (
        <TagPostsList />
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
    marginBottom: Units.s32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Units.s16,
    borderRadius: Units.s24,
    backgroundColor: Colors.surface.primary,
    ...GeneralStyles.shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: Units.s20,
    paddingHorizontal: Units.s16,
    borderRadius: Units.s24
  },
  clearButton: {
    height: 60,
    width: 60,
    backgroundColor: Colors.primary,
    borderRadius: Units.s24,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: Units.s8,
  },
  clearButtonText: {
    color: Colors.text.onSurface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContent: {
    paddingHorizontal: Units.s16,
    gap: Units.s8,
  },
  tagButton: {
    paddingHorizontal: Units.s12,
    paddingVertical: Units.s8,
    borderRadius: Units.s16,
  },
  selectedTagButton: {
    backgroundColor: Colors.primary
  },
  tagText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedTagText: {
    color: Colors.text.onSurface,
  },
  filteredSection: {
    flex: 1,
    paddingHorizontal: Units.s16,
  },
  filteredTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Units.s16,
  },
  filteredContent: {
    paddingBottom: Units.s16,
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
});
