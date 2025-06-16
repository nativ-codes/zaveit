import { GeneralStyles } from "@/common/styles";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { styles } from "./tag-item.style";
import { TagItemPropsType } from "./tag-item.type";

function TagItem({ tag, isSelected, onPress }: TagItemPropsType) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={StyleSheet.compose(
        styles.tagButton,
        isSelected && styles.selectedTagButton
      )}
      testID={`Components_TagItem_${tag}`}
    >
      <Text
        style={StyleSheet.compose(
          GeneralStyles.textBodyLargeSecondary,
          isSelected && styles.selectedTagText
        )}
      >
        #{tag}
      </Text>
    </TouchableOpacity>
  );
}

export default TagItem;
