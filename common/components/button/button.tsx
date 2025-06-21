import { ACTIVE_OPACITY } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import styles from "./button.style";
import { ButtonPropsType } from "./button.type";

function Button({ label, onPress, isDisabled = false }: ButtonPropsType) {
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
      <Text style={GeneralStyles.textTitlePostMediumOnPrimary}>{label}</Text>
    </TouchableOpacity>
  );
}

export default Button;
