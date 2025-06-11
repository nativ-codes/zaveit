import { StyleSheet } from "react-native";

import { Colors, Units } from "@/common/constants";

import { ButtonIconSizeEnum, ButtonIconTypeEnum } from "./button.type";

export default StyleSheet.create({
  [`buttonIcon_size_${ButtonIconSizeEnum.small}`]: {
    width: Units.s32,
    height: Units.s32,
    borderRadius: Units.s32 / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  [`button_size_${ButtonIconSizeEnum.small}_icon`]: {
    fontSize: Units.s16,
  },
  [`buttonIcon_size_${ButtonIconSizeEnum.medium}`]: {
    width: Units.s40,
    height: Units.s40,
    borderRadius: Units.s40 / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  [`button_size_${ButtonIconSizeEnum.medium}_icon`]: {
    fontSize: Units.s20,
  },
  [`buttonIcon_size_${ButtonIconSizeEnum.large}`]: {
    width: Units.s48,
    height: Units.s48,
    borderRadius: Units.s48 / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  [`button_size_${ButtonIconSizeEnum.large}_icon`]: {
    fontSize: Units.s24,
  },
  [`button_type_${ButtonIconTypeEnum.primary}`]: {
    backgroundColor: Colors.background.primary,
  },
  [`button_type_${ButtonIconTypeEnum.primary}_icon`]: {
    color: Colors.text.primary,
  },
  [`button_type_${ButtonIconTypeEnum.secondary}`]: {
    backgroundColor: Colors.background.primary,
  },
  [`button_type_${ButtonIconTypeEnum.secondary}_icon`]: {
    color: Colors.text.primary,
  },
  [`button_type_${ButtonIconTypeEnum.contrast}`]: {
    backgroundColor: Colors.background.primary,
  },
  [`button_type_${ButtonIconTypeEnum.contrast}_icon`]: {
    color: Colors.text.primary,
  },
  [`button_type_${ButtonIconTypeEnum.outline}`]: {
    backgroundColor: Colors.background.primary,
    borderWidth: Units.s1,
    borderColor: Colors.background.primary,
  },
  [`button_type_${ButtonIconTypeEnum.outline}_icon`]: {
    color: Colors.text.primary,
  },
  [`button_type_${ButtonIconTypeEnum.ghost}`]: {
    backgroundColor: Colors.transparent,
  },
  [`button_type_${ButtonIconTypeEnum.ghost}_icon`]: {
    color: Colors.text.primary,
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Units.s8,
  },
  buttonFilterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s16,
    borderRadius: Units.s12,
    borderWidth: Units.s1,
    paddingVertical: Units.s8,
    paddingHorizontal: Units.s16,
    borderColor: Colors.background.primary,
  },
  [`button_size_${ButtonIconSizeEnum.small}`]: {
    paddingHorizontal: Units.s16,
    paddingVertical: Units.s8,
    borderRadius: Units.s32,
  },
  [`button_size_${ButtonIconSizeEnum.medium}`]: {
    paddingHorizontal: Units.s20,
    paddingVertical: Units.s12,
    borderRadius: Units.s32,
  },
  [`button_size_${ButtonIconSizeEnum.large}`]: {
    paddingHorizontal: Units.s24,
    paddingVertical: Units.s16,
    borderRadius: Units.s32,
  },
  buttonLink_icon: {
    color: Colors.text.primary,
  },
  button_disabled: {
    backgroundColor: Colors.background.primary,
    borderWidth: Units.s0,
  },
  button_disabled_icon: {
    color: Colors.text.primary,
  },
});
