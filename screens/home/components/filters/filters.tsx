import { Colors } from "@/common/constants/colors";
import { ACTIVITY_OPACITY } from "@/common/constants/ui";
import React from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { styles } from "./filters.style";
import { FiltersType } from "./filters.type";

const TAGS = [
  "Technology",
  "Science",
  "Art",
  "Music",
  "Sports",
  "Food",
  "Travel",
  "Health",
  "Fitness",
  "Education",
  "Business",
  "Finance",
  "Nature",
  "Animals",
  "History",
  "Culture",
  "Politics",
  "Entertainment",
  "Fashion",
  "Beauty",
  "Gaming",
  "Books",
  "Movies",
  "Photography",
  "Architecture",
  "Design",
  "Cars",
  "Space",
  "Weather",
  "Environment",
] as const;

export const Filters: React.FC<FiltersType> = ({
  searchQuery,
  onSearchChange,
  onTagSelect,
  selectedTags,
}) => {
  const handleTagPress = (tag: string) => {
    onTagSelect(tag);
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search your saved content..."
        value={searchQuery}
        placeholderTextColor={Colors.text.placeholder}
        onChangeText={onSearchChange}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContent}
      >
        {TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              activeOpacity={ACTIVITY_OPACITY}
              style={[
                styles.tagButton,
                isSelected && styles.selectedTagButton,
              ]}
              onPress={() => handleTagPress(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  isSelected && styles.selectedTagText,
                ]}
              >
                #{tag.toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default Filters;
