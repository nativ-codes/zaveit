import { ACTIVE_OPACITY } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./tag-item.style";
import { TagItemPropsType } from "./tag-item.type";

function TagItem({ tag, isSelected, isReadOnly, onPress }: TagItemPropsType) {
  const Wrapper = isReadOnly ? View : TouchableOpacity;
  const onPressHandler = isReadOnly ? undefined : onPress;

  return (
    <Wrapper
      onPress={onPressHandler}
      activeOpacity={ACTIVE_OPACITY}
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
    </Wrapper>
  );
}

export default TagItem;
