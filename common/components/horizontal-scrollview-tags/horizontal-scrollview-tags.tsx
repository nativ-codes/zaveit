import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { ScrollView } from "react-native";
import { HorizontalScrollviewTagsPropsType } from "./horizontal-scrollview-tags.type";
import TagItem from "./tag-item/tag-item";

const HorizontalScrollviewTags = ({
  primaryTags,
  secondaryTags,
  selectedPrimaryTag,
  selectedSecondaryTags,
  onPrimaryTagSelect,
  onSecondaryTagSelect,
}: HorizontalScrollviewTagsPropsType) => {
  const handleOnPrimaryTagSelect = (tag: string) => {
    onPrimaryTagSelect((prevPrimaryTagSelected) => {
      if (prevPrimaryTagSelected === tag) {
        onSecondaryTagSelect([]);
        return undefined;
      } else {
        return tag;
      }
    });
  };

  const handleOnSecondaryTagSelect = (tag: string) => {
    onSecondaryTagSelect((prevSecondaryTags) => {
      if (prevSecondaryTags.includes(tag)) {
        return prevSecondaryTags.filter((t) => t !== tag);
      } else {
        return [...prevSecondaryTags, tag];
      }
    });
  };

  return (
    <Spacer
      gap="s8"
      style={GeneralStyles.directionRow}
      testID="Components_HorizontalScrollviewTags"
    >
      {selectedPrimaryTag ? (
        <Spacer direction="left" size="s16">
          <TagItem
            key={selectedPrimaryTag}
            tag={selectedPrimaryTag}
            isSelected={true}
            onPress={() => handleOnPrimaryTagSelect(selectedPrimaryTag)}
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
                onPress={() => onPrimaryTagSelect(tag)}
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
                onPress={() => handleOnSecondaryTagSelect(tag)}
                isSelected={selectedSecondaryTags.includes(tag)}
              />
            ))}
          </Spacer>
        </ScrollView>
      )}
    </Spacer>
  );
};

export default HorizontalScrollviewTags;
