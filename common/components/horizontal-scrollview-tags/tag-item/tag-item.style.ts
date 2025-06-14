import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  tagButton: {
    paddingHorizontal: Units.s12,
    paddingVertical: Units.s8,
    borderRadius: Units.s16,
  },
  selectedTagButton: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedTagText: {
    color: Colors.text.onSurface,
  },
});
