import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { Haptics } from "@/common/utils/haptics";
import { toggleTag } from "@/common/utils/misc";
import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import TagItem from "../tag-item/tag-item";
import { HorizontalScrollViewTagsPropsType } from "./horizontal-scrollview-tags.type";

const HorizontalScrollViewTags = ({
  primaryTags,
  secondaryTags,
  selectedPrimaryTag,
  selectedSecondaryTags,
  onPrimaryTagSelect,
  onSecondaryTagSelect,
}: HorizontalScrollViewTagsPropsType) => {
  // Stable, so the memoized TagItems skip re-rendering when only another Tag changed.
  // Secondary Tags only show under a selected primary, so any primary change starts them empty.
  const handleOnPrimaryTagSelect = useCallback(
    (tag: string) => {
      Haptics.selection();
      onPrimaryTagSelect((prevPrimaryTagSelected) =>
        prevPrimaryTagSelected === tag ? undefined : tag
      );
      onSecondaryTagSelect([]);
    },
    [onPrimaryTagSelect, onSecondaryTagSelect]
  );

  const handleOnSecondaryTagSelect = useCallback(
    (tag: string) => {
      Haptics.selection();
      onSecondaryTagSelect((prevSecondaryTags) =>
        toggleTag({
          tags: prevSecondaryTags,
          tag,
        })
      );
    },
    [onSecondaryTagSelect]
  );

  return (
    <Spacer
      gap="s8"
      style={GeneralStyles.directionRow}
      testID="Components_HorizontalScrollViewTags"
    >
      {selectedPrimaryTag ? (
        <Spacer direction="left" size="s16">
          <TagItem
            key={selectedPrimaryTag}
            tag={selectedPrimaryTag}
            isSelected={true}
            onPress={handleOnPrimaryTagSelect}
          />
        </Spacer>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Spacer
            style={GeneralStyles.directionRow}
            direction="horizontal"
            size="s16"
            gap="s8"
          >
            {primaryTags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                onPress={handleOnPrimaryTagSelect}
                isSelected={false}
              />
            ))}
          </Spacer>
        </ScrollView>
      )}
      {selectedPrimaryTag && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Spacer
            style={GeneralStyles.directionRow}
            direction="right"
            size="s16"
            gap="s8"
          >
            {secondaryTags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                onPress={handleOnSecondaryTagSelect}
                isSelected={selectedSecondaryTags.includes(tag)}
              />
            ))}
          </Spacer>
        </ScrollView>
      )}
    </Spacer>
  );
};

export default HorizontalScrollViewTags;
