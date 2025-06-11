import { StyleProp, ViewStyle } from "react-native";

import { Units } from "@/common/constants";

export type RowPropsType = {
  testID?: string;
  gap?: keyof typeof Units;
  left?: React.ReactElement | null;
  center?: React.ReactElement | null;
  right?: React.ReactElement | null;
  style?: StyleProp<ViewStyle>;
};
