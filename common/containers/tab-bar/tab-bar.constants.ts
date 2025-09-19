import { TabBarItemType } from "./tab-bar.type";

const baseTabBarItems: TabBarItemType[] = [
  {
    name: "index",
    label: "HOME",
    iconFocused: "home",
    iconUnfocused: "home-outline",
  },
  {
    name: "search",
    label: "SEARCH",
    iconFocused: "tag-multiple",
    iconUnfocused: "tag-multiple-outline",
  },
  {
    name: "settings",
    label: "SETTINGS",
    iconFocused: "cog",
    iconUnfocused: "cog-outline",
  },
];

const debugTabBarItems: TabBarItemType[] = [{
  name: "debug",
  label: "DEBUG",
  iconFocused: "bug",
  iconUnfocused: "bug-outline",
}];

export const TAB_BAR_ITEMS: TabBarItemType[] = __DEV__ 
  ? [...baseTabBarItems, ...debugTabBarItems] 
  : baseTabBarItems;
