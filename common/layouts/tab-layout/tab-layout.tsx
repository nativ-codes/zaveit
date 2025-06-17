import React, { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT, Units } from "@/common/constants";

import styles from "./tab-layout.style";
import { TabLayoutPropsType } from "./tab-layout.type";

function TabLayout({ children, testID, style, footer }: TabLayoutPropsType) {
  const insets = useSafeAreaInsets();

  return (
    <View testID={`${testID}_TabLayout`} style={styles.wrapper}>
      <ScrollView
        testID={`${testID}_StaticScreenLayout_ScrollView`}
        contentContainerStyle={StyleSheet.compose(style, {
          paddingTop: insets.top,
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

export default memo(TabLayout);
