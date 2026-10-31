import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Units } from "@/common/constants";

import styles from "./row.style";
import { RowPropsType } from "./row.type";

function Row({
  left,
  center,
  right,
  gap = "s16",
  style,
  ...rest
}: RowPropsType) {
  return (
    <View
      style={StyleSheet.flatten([styles.container, { gap: Units[gap] }, style])}
      {...rest}
    >
      {left && <View style={styles.row}>{left}</View>}
      {center && <View style={styles.center}>{center}</View>}
      {right && <View style={styles.row}>{right}</View>}
    </View>
  );
}

export default memo(Row);
