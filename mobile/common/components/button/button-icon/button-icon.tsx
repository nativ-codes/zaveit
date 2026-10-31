import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import Icon from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import styles from "./button-icon.style";
import { ButtonIconPropsType, ButtonIconThemeMap } from "./button-icon.type";

function ButtonIcon({ iconName, onPress, theme = "primary" }: ButtonIconPropsType) {
  return (
    <TouchableOpacity
      activeOpacity={ACTIVE_OPACITY}
      onPress={onPress}
      style={StyleSheet.compose(styles.wrapper, ButtonIconThemeMap[theme])}
    >
      <Icon name={iconName} size={Units.s24} color={Colors.text.onPrimary} />
    </TouchableOpacity>
  );
}

export default ButtonIcon;
