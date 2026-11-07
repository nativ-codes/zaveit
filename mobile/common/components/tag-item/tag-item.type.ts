export enum TagItemSizeEnum {
  small = "small",
  medium = "medium",
}

export type TagItemPropsType = {
  tag: string;
  size?: keyof typeof TagItemSizeEnum;
  isSelected?: boolean;
  isReadOnly?: boolean;
  // Gets the tag, so a list can pass one stable handler and the memo holds.
  onPress?: (tag: string) => void;
  shouldUsePrefixedTag?: boolean;
}; 