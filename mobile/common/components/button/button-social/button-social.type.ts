import Icon from "@expo/vector-icons/AntDesign";

export type ButtonSocialPropsType = {
  label: string;
  iconName: keyof typeof Icon.glyphMap;
  onPress: () => void;
  isDisabled?: boolean;
};
