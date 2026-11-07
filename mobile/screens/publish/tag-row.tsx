import { TagItem } from "@/common/components";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { Haptics } from "@/common/utils/haptics";
import { toggleTag } from "@/common/utils/misc";
import { usePosts } from "@/config/storage";
import { getSortedTags } from "@/screens/search/search.util";
import React, { useMemo } from "react";
import { ScrollView, Text } from "react-native";
import styles from "./publish.style";

// Search's tag row, but multi-select: a Post with any picked Tag is in the List.
function TagRow({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  const posts = usePosts();
  const userTags = useMemo(() => getSortedTags(posts), [posts]);
  const postCount = posts.filter((post) => post.tags?.some((tag) => selected.includes(tag))).length;

  const handleOnTagPress = (tag: string) => {
    Haptics.selection();
    onChange(toggleTag({ tags: selected, tag }));
  };

  return (
    <Spacer gap="s8">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed}>
        <Spacer style={GeneralStyles.directionRow} direction="horizontal" size="s16" gap="s8">
          {userTags.map((tag) => (
            <TagItem key={tag} tag={tag} isSelected={selected.includes(tag)} onPress={() => handleOnTagPress(tag)} />
          ))}
        </Spacer>
      </ScrollView>
      <Text style={GeneralStyles.textLabelMediumSecondary}>
        {selected.length
          ? `${postCount} Posts. New Posts with these Tags join automatically.`
          : "Pick one or more. Posts with any of them are in the List."}
      </Text>
    </Spacer>
  );
}

export default TagRow;
