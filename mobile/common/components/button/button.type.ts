import { GeneralStyles } from "@/common/styles/general-styles";

export enum ButtonTypeEnum {
  primary = "primary",
  ghost = "ghost",
}

export type ButtonPropsType = {
  label: string;
  type: keyof typeof ButtonTypeEnum;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
};

export const ButtonTextVariantMap = {
  [ButtonTypeEnum.primary]: GeneralStyles.textTitlePostMediumOnPrimary,
  [ButtonTypeEnum.ghost]: GeneralStyles.textTitlePostMediumPrimary,
};