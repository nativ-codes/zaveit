import { ViewStyle } from "react-native";

export type ScreenLayoutPropsType = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  footer?: React.ReactNode;
  hasTopInset?: boolean;
}; 