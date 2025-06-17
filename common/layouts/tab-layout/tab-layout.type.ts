import { ViewStyle } from "react-native";

export type TabLayoutPropsType = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  footer?: React.ReactNode;
};
