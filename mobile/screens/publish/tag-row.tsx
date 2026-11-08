import { SearchInput, SheetModal, TagItem } from "@/common/components";
import { Colors, Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { Haptics } from "@/common/utils/haptics";
import { toggleTag } from "@/common/utils/misc";
import { usePosts } from "@/config/storage";
import { getPickerTags, getSortedTags } from "@/screens/search/search.util";
import Icon from "@expo/vector-icons/Feather";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TagPickerPropsType = { selected: string[]; onChange: (tags: string[]) => void };

// Search plus every Tag, picked ones first. Multi-select: a Post with any picked Tag is in the List.
export function TagPicker({ selected, onChange }: TagPickerPropsType) {
  const posts = usePosts();
  const [query, setQuery] = useState("");
  const userTags = useMemo(() => getSortedTags(posts), [posts]);
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => post.tags?.forEach((tag) => (counts[tag] = (counts[tag] || 0) + 1)));
    return counts;
  }, [posts]);
  const shown = getPickerTags({ tags: userTags, selected, query });

  const handleOnTagPress = (tag: string) => {
    Haptics.selection();
    onChange(toggleTag({ tags: selected, tag }));
  };

  return (
    <Spacer gap="s16">
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${userTags.length} Tags`}
        isActionVisible={Boolean(query.length)}
        onAction={() => setQuery("")}
      />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.wrap}>
          {shown.map((tag) => (
            <TagItem
              key={tag}
              tag={`#${tag} (${tagCounts[tag] ?? 0})`}
              shouldUsePrefixedTag={false}
              isSelected={selected.includes(tag)}
              onPress={() => handleOnTagPress(tag)}
            />
          ))}
          {shown.length === 0 && (
            <Text style={GeneralStyles.textLabelMediumSecondary}>{`No Tag matches "${query}"`}</Text>
          )}
        </View>
      </ScrollView>
    </Spacer>
  );
}

// A field showing the picked Tags; tapping it opens the picker in a sheet. Picks apply straight away.
function TagRow({ selected, onChange }: TagPickerPropsType) {
  const posts = usePosts();
  const [isOpen, setIsOpen] = useState(false);
  const postCount = posts.filter((post) => post.tags?.some((tag) => selected.includes(tag))).length;

  return (
    <Spacer gap="s8">
      <TouchableOpacity
        style={styles.field}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={selected.length ? `Tags: ${selected.join(", ")}` : "Choose Tags"}
      >
        {selected.length ? (
          <View style={styles.wrap}>
            {selected.map((tag) => (
              <TagItem key={tag} tag={tag} isSelected size="small" isReadOnly />
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>Choose Tags</Text>
        )}
        <Icon name="plus" size={Units.s20} color={Colors.text.secondary} />
      </TouchableOpacity>
      <Text style={GeneralStyles.textLabelMediumSecondary}>
        {selected.length
          ? `${postCount} Posts. New Posts with these Tags join automatically.`
          : "Pick one or more. Posts with any of them are in the List."}
      </Text>
      <SheetModal
        isVisible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        title="Choose Tags"
        body={
          selected.length
            ? `${selected.length} picked · ${postCount} Posts`
            : "Posts with any of these Tags are in the List."
        }
      >
        <TagPicker selected={selected} onChange={onChange} />
      </SheetModal>
    </Spacer>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: Units.s8, alignItems: "center" },
  list: { maxHeight: 150 },
  placeholder: { flex: 1, color: Colors.text.placeholder, fontSize: 16 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s8,
    minHeight: Units.s64,
    padding: Units.s16,
    borderRadius: Units.s24,
    backgroundColor: Colors.surface.primary,
    ...GeneralStyles.shadow,
  },
});

export default TagRow;
