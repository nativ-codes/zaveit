import React, { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT, Units } from "@/common/constants";

import styles from "./screen-layout.style";
import { ScreenLayoutPropsType } from "./screen-layout.type";

function ScreenLayout({ children, testID, style, footer, hasTopInset = true }: ScreenLayoutPropsType) {
  const insets = useSafeAreaInsets();

  return (
    <View testID={`${testID}_ScreenLayout`} style={styles.wrapper}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        testID={`${testID}_StaticScreenLayout_ScrollView`}
        contentContainerStyle={StyleSheet.compose(style, {
          paddingTop: hasTopInset ? insets.top : 0,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Units.s16,
        })}
      >
        {children}
      </ScrollView>
      <View
        style={StyleSheet.compose(styles.footer, {
          bottom: insets.bottom,
        })}
      >
        {footer}
      </View>
    </View>
  );
}

export default memo(ScreenLayout); 