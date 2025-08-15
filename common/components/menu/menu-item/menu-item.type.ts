export type MenuItemPropsType = {
  onPress: () => void;
  label: string;
  right?: React.ReactElement;
  description?: string;
};