import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";
import { TagItemSizeEnum } from "./tag-item.type";

export default StyleSheet.create({
  [`tagButtonSize_${TagItemSizeEnum.medium}`]: {
    paddingHorizontal: Units.s12,
    paddingVertical: Units.s8,
    borderRadius: Units.s16,
  },
  [`tagButtonSize_${TagItemSizeEnum.small}`]: {
    paddingHorizontal: Units.s8,
    paddingVertical: Units.s4,
    borderRadius: Units.s8,
  },
  selectedTagButton: {
    backgroundColor: Colors.primary,
  },
  selectedTagText: {
    color: Colors.text.onPrimary,
  },
});
