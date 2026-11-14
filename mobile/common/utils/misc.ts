import { Platform } from "react-native";

import { Units } from "@/common/constants";

export const noop = () => {};

type ToggleTagType = {
  tags: string[];
  tag: string;
};

export const toggleTag = ({ tags, tag }: ToggleTagType) =>
  tags.includes(tag) ? tags.filter((t) => t !== tag) : [...(tags || []), tag];

// Android 3-button nav fills its ~48dp inset edge to edge, so content needs extra space above it;
// the ~24dp gesture-nav inset already reads as a margin.
// shortcut: infers the nav mode from the inset size, swap for a native nav-mode check if a device breaks it.
export const getNavBarOffset = (bottomInset: number) =>
  Platform.OS === "android" && bottomInset > Units.s32 ? Units.s16 : 0;
