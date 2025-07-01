import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/AntDesign";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import styles from "./button-social.style";
import { ButtonSocialPropsType } from "./button-social.type";

function ButtonSocial({
  label,
  iconName,
  onPress,
  isDisabled = false,
}: ButtonSocialPropsType) {
  return (
    <TouchableOpacity
      activeOpacity={ACTIVE_OPACITY}
      style={[
        GeneralStyles.actionableContent,
        styles.button,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Icon name={iconName} size={Units.s24} color={Colors.text.onPrimary} />
      <View
        style={StyleSheet.compose(
          GeneralStyles.centerContent,
          GeneralStyles.flex
        )}
      >
        <Text style={GeneralStyles.textTitlePostMediumOnPrimary}>{label}</Text>
      </View>
      <View style={styles.emptyView} />
    </TouchableOpacity>
  );
}

export default ButtonSocial;
