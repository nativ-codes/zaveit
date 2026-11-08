import { StyleProp, ImageStyle } from "react-native";

export type PostImagePropsType = {
  thumbnailUrl?: string;
  style: StyleProp<ImageStyle>;
  onError?: () => void;
};
