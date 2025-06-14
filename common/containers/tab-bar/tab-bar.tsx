import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";

import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TAB_BAR_ITEMS } from "./tab-bar.constants";
import styles from "./tab-bar.styles";

function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      style={StyleSheet.flatten([
        styles.tabBarStyle,
        {
          bottom: insets.bottom || Units.s16,
        },
        GeneralStyles.shadow,
      ])}
    >
      {TAB_BAR_ITEMS.map((tab, index) => {
        const isFocused = state.index === index;
        const iconName = isFocused ? tab.iconFocused : tab.iconUnfocused;
        const iconColor = isFocused ? Colors.primary : Colors.text.secondary;
        const handleOnPress = () => navigation.navigate(tab.name);

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={handleOnPress}
            activeOpacity={ACTIVE_OPACITY}
            style={styles.tabBarItem}
          >
            <Icon
              name={iconName as keyof typeof Icon.glyphMap}
              size={Units.s24}
              color={iconColor}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default TabBar;
