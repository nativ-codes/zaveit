import { ACTIVE_OPACITY } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import styles from "./tag-item.style";
import { TagItemPropsType, TagItemSizeEnum } from "./tag-item.type";

function TagItem({
  tag,
  isSelected,
  isReadOnly,
  onPress,
  size = TagItemSizeEnum.medium,
  shouldUsePrefixedTag = true,
}: TagItemPropsType) {
  const Wrapper = isReadOnly ? View : TouchableOpacity;
  const onPressHandler = isReadOnly ? undefined : onPress;
  const textStyle = StyleSheet.flatten([
    size === TagItemSizeEnum.small
      ? GeneralStyles.textLabelSmallSecondary
      : GeneralStyles.textLabelLargeSecondary,
    isSelected && styles.selectedTagText,
  ]);
  const containerStyle = StyleSheet.flatten([
    styles[`tagButtonSize_${size}`],
    isSelected && styles.selectedTagButton,
  ]);

  return (
    <Wrapper
      onPress={onPressHandler}
      activeOpacity={ACTIVE_OPACITY}
      style={containerStyle}
      testID={`Components_TagItem_${tag}`}
    >
      <Text style={textStyle}>{shouldUsePrefixedTag ? `#${tag}` : tag}</Text>
    </Wrapper>
  );
}

export default TagItem;
