import { PreviewPost } from "@/common/components";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { styles } from "./filter-results.style";
import { FilterResultsType } from "./filter-results.type";

function FilterResults({
  searchQuery,
  selectedTags,
  shareIntents,
  onPostPress,
}: FilterResultsType) {
  const filteredIntents = useMemo(() => {
    return shareIntents.filter((intent) => {
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

  if (filteredIntents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery || selectedTags.length > 0
            ? "No results found for your search criteria"
            : "No saved content yet"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filteredIntents.map((intent) => (
        <PreviewPost
          key={intent.timestamp}
          url={intent.url}
          title={intent.title}
          thumbnail={intent.thumbnail}
          tags={intent.tags}
          onPress={() => onPostPress(intent.timestamp)}
        />
      ))}
    </View>
  );
}

export default FilterResults; 