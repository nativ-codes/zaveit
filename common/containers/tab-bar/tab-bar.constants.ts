export const TAB_BAR_ITEMS = [
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
  __DEV__ && {
    name: "debug",
    label: "DEBUG",
    iconFocused: "bug",
    iconUnfocused: "bug-outline",
  },
].filter(Boolean);
