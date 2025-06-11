import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { Units } from "@/common/constants";

import { SpacerPropsType } from "./spacer.type";
import { getSpacerStyles } from "./spacer.util";

function Spacer({
  direction,
  size,
  style,
  children,
  gap = "s0",
  ...rest
}: SpacerPropsType) {
  const composedStyle = getSpacerStyles(direction, size);

  return (
    <View
      style={StyleSheet.flatten([composedStyle, { gap: Units[gap] }, style])}
      {...rest}
    >
      {children}
    </View>
  );
}

export default memo(Spacer);
