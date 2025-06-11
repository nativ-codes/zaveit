import { TextVariantEnum } from "../text/text.type";

export type ButtonPropsType = {
  label?: string;
  testID?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  size?: keyof typeof ButtonIconSizeEnum;
  type?: keyof typeof ButtonIconTypeEnum;
  iconName?: string;
};

export type ButtonIconPropsType = Omit<ButtonPropsType, "label">;

export type ButtonLinkPropType = Omit<ButtonPropsType, "type" | "iconName">;

export enum ButtonIconTypeEnum {
  primary = "primary",
  secondary = "secondary",
  contrast = "contrast",
  outline = "outline",
  ghost = "ghost",
}

export enum ButtonIconSizeEnum {
  "small" = "small",
  "medium" = "medium",
  "large" = "large",
}

export const ButtonTextVariantMap = {
  [ButtonIconSizeEnum.small]: TextVariantEnum["label-small"],
  [ButtonIconSizeEnum.medium]: TextVariantEnum["label-medium"],
  [ButtonIconSizeEnum.large]: TextVariantEnum["label-large"],
};
