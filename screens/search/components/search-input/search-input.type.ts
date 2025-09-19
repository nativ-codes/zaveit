import { ButtonIconPropsType } from "@/common/components/button/button-icon/button-icon.type";

export type SearchInputPropsType = {
  value: string;
  onChangeText: (text: string) => void;
  isActionVisible: boolean;
  actionIcon?: ButtonIconPropsType["iconName"];
  onAction: () => void;
  placeholder?: string;
};
