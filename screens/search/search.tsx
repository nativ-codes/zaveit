import { PreviewPost } from "@/common/components";
import { Colors } from "@/common/constants/colors";
import { SafeAreaEdges } from "@/common/constants/safe-area";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { useAuth } from "@/config/contexts/auth.context";
import { getShareIntents } from "@/config/storage/persistent";
import { StoredShareIntent } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shareIntents, setShareIntents] = useState<StoredShareIntent[]>([]);

  useEffect(() => {
    const intents = getShareIntents();
    setShareIntents(intents);
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
    const tagCounts = new Map<string, number>();
    
    // Count posts for each tag
    shareIntents.forEach((intent: StoredShareIntent) => {
      intent.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to array and sort by count (descending)
    return Array.from(tagCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([tag]) => tag);
  }, [shareIntents]);

  const getTagCount = (tag: string) => {
    return shareIntents.filter((intent: StoredShareIntent) => intent.tags.includes(tag)).length;
  };

  const filteredIntents = useMemo(() => {
    return shareIntents.filter((intent: StoredShareIntent) => {
      const matchesSearch = searchQuery
        ? (intent.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           intent.url.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => intent.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, shareIntents]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>
            Sign in to search your saved content
          </Text>
          <Text style={styles.loginSubtitle}>
            Your saved content will be synced across devices
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      {filteredIntents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedTags.length > 0
              ? "No results found for your search criteria"
              : "Start searching or select tags to filter your content"}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {filteredIntents.map((intent) => (
            <PreviewPost
              key={intent.timestamp}
              url={intent.url}
              title={intent.title}
              thumbnail={intent.thumbnail}
              tags={intent.tags}
              onPress={() =>
                router.push({
                  pathname: "/share-intent/[id]",
                  params: { id: intent.timestamp.toString() },
                })
              }
            />
          ))}
        </ScrollView>
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
