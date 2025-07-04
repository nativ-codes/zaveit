import { ACTIVE_OPACITY, Colors } from "@/common/constants";
import Spacer from "@/common/layouts/spacer/spacer";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import SpinningLoader from "../spinning-loader/spinning-loader";
import ButtonIcon from "./button-icon/button-icon";
import ButtonSocial from "./button-social/button-social";
import styles from "./button.style";
import { ButtonPropsType } from "./button.type";

function Button({ label, onPress, isLoading = false }: ButtonPropsType) {
  return (
    <TouchableOpacity
      activeOpacity={ACTIVE_OPACITY}
      style={[
        GeneralStyles.actionableContent,
        styles.button,
        isLoading && styles.loading,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <Spacer style={GeneralStyles.directionRow} gap="s16">
          <SpinningLoader color={Colors.text.onPrimary} size="small" />
          <Text style={GeneralStyles.textTitlePostMediumOnPrimary}>Loading...</Text>
        </Spacer>
      ) : (
        <Text style={GeneralStyles.textTitlePostMediumOnPrimary}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

Button.Icon = ButtonIcon;
Button.Social = ButtonSocial;
export default Button;
