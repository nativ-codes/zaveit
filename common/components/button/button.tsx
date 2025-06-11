import Text from "@/common/components/text/text";
import { ACTIVE_OPACITY, ACTIVE_OPACITY_NO_FEEDBACK } from "@/common/constants";
import { noop } from "@/common/utils";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import styles from "./button.style";
import {
  ButtonIconPropsType,
  ButtonIconSizeEnum,
  ButtonIconTypeEnum,
  ButtonPropsType,
  ButtonTextVariantMap,
} from "./button.type";

function Button({
  label,
  testID,
  onPress,
  iconName,
  isDisabled,
  size = ButtonIconSizeEnum.small,
  type = ButtonIconTypeEnum.primary,
}: ButtonPropsType) {
  return (
    <TouchableOpacity
      testID={`${testID}_Button`}
      activeOpacity={
        onPress && !isDisabled ? ACTIVE_OPACITY : ACTIVE_OPACITY_NO_FEEDBACK
      }
      onPress={isDisabled ? noop : onPress}
      style={[
        styles.buttonWrapper,
        styles[`button_size_${size}`],
        styles[`button_type_${type}`],
        isDisabled && styles.button_disabled,
      ]}
    >
      {iconName ? (
        <Icon
          size={size}
          name={iconName}
          color={
            isDisabled
              ? styles.button_disabled_icon.color
              : styles[`button_type_${type}_icon`].color
          }
        />
      ) : null}
      <Text
        variant={ButtonTextVariantMap[size]}
        color={
          isDisabled
            ? styles.button_disabled_icon.color
            : styles[`button_type_${type}_icon`].color
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ButtonIcon({
  testID,
  onPress,
  iconName,
  size = ButtonIconSizeEnum.small,
  type = ButtonIconTypeEnum.secondary,
}: ButtonIconPropsType) {
  return (
    <TouchableOpacity
      testID={`${testID}_ButtonIcon`}
      activeOpacity={onPress ? ACTIVE_OPACITY : ACTIVE_OPACITY_NO_FEEDBACK}
      onPress={onPress}
      style={StyleSheet.compose(
        styles[`buttonIcon_size_${size}`],
        styles[`button_type_${type}`]
      )}
    >
      <Icon
        name={iconName}
        size={size}
        color={styles[`button_type_${type}_icon`].color}
      />
    </TouchableOpacity>
  );
}

function ButtonLink({
  label,
  testID,
  onPress,
  isDisabled,
  size = ButtonIconSizeEnum.small,
}: ButtonPropsType) {
  return (
    <TouchableOpacity
      testID={`${testID}_ButtonLink`}
      activeOpacity={
        onPress && !isDisabled ? ACTIVE_OPACITY : ACTIVE_OPACITY_NO_FEEDBACK
      }
      onPress={isDisabled ? noop : onPress}
    >
      <Text
        variant={ButtonTextVariantMap[size]}
        color={
          isDisabled
            ? styles.button_disabled_icon.color
            : styles.buttonLink_icon.color
        }
        textDecorationLine="underline"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ButtonDropDown({
  label,
  testID,
  onPress,
  isDisabled,
}: ButtonPropsType) {
  return (
    <TouchableOpacity
      testID={`${testID}_DropDown_${label}`}
      activeOpacity={
        onPress && !isDisabled ? ACTIVE_OPACITY : ACTIVE_OPACITY_NO_FEEDBACK
      }
      onPress={isDisabled ? noop : onPress}
      style={StyleSheet.compose(
        styles.buttonFilterWrapper,
        isDisabled && styles.button_disabled
      )}
    >
      <Text
        variant="body-small"
        color={
          isDisabled
            ? styles.button_disabled_icon.color
            : styles.button_type_outline_icon.color
        }
      >
        {label}
      </Text>
      <Icon
        name="caret-down"
        color={
          isDisabled
            ? styles.button_disabled_icon.color
            : styles.button_type_outline_icon.color
        }
      />
    </TouchableOpacity>
  );
}

Button.Icon = ButtonIcon;
Button.Link = ButtonLink;
export default Button;
