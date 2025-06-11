import { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";

import { Units } from "@/common/constants";

export enum SpacerDirectionEnum {
  top = "top",
  right = "right",
  bottom = "bottom",
  left = "left",
  full = "full",
  vertical = "vertical",
  horizontal = "horizontal",
}

export type DirectionType =
  | keyof typeof SpacerDirectionEnum
  | (keyof typeof SpacerDirectionEnum)[];

export type SizeType = keyof typeof Units | (keyof typeof Units)[];

export type SpacerPropsType = {
  direction?: DirectionType;
  size?: SizeType;
  gap?: keyof typeof Units;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  testID?: string;
};

export type StylePropsType = {
  [key: string]: ViewStyle;
};
