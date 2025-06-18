export enum TagItemSizeEnum {
  small = "small",
  medium = "medium",
}

export type TagItemPropsType = {
  tag: string;
  size?: keyof typeof TagItemSizeEnum;
  isSelected?: boolean;
  isReadOnly?: boolean;
  onPress?: () => void;
  shouldUsePrefixedTag?: boolean;
}; 