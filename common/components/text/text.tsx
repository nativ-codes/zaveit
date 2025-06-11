import React, { memo } from "react";
import { Text as RNText, StyleSheet } from "react-native";

import { Colors } from "@/common/constants";

import styles from "./text.style";
import { TextPropsType, TextVariantEnum } from "./text.type";

function Text({
  children,
  variant = TextVariantEnum["body-default"],
  numberOfLines,
  ellipsizeMode,
  onPress,
  color = Colors.text.primary,
  ...style
}: TextPropsType) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={StyleSheet.flatten([
        styles[`text_variant_${variant}`],
        { color },
        style,
      ])}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
}

export default memo(Text);
