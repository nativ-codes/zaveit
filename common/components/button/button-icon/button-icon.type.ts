import { Colors } from "@/common/constants";
import Icon from "@expo/vector-icons/Feather";

export type ButtonIconPropsType = {
  iconName: keyof typeof Icon.glyphMap;
  onPress: () => void;
  theme?: keyof typeof ButtonIconThemeEnum;
};

export enum ButtonIconThemeEnum {
  primary = "primary",
  error = "error",
}

export const ButtonIconThemeMap = {
  [ButtonIconThemeEnum.primary]: {
    backgroundColor: Colors.primary,
  },
  [ButtonIconThemeEnum.error]: {
    backgroundColor: Colors.error,
  },
};
