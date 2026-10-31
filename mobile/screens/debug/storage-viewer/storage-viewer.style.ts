import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  storageValueContainer: {
    borderTopWidth: Units.s2,
    borderTopColor: Colors.surface.secondary,
    backgroundColor: Colors.surface.secondary,
    marginHorizontal: -Units.s16,
    padding: Units.s24,
  },
  storageValue: {
    fontSize: Units.s12,
    color: Colors.text.primary,
    fontFamily: "monospace",
    lineHeight: Units.s20,
  },
  emptyState: {
    textAlign: "center",
    fontSize: Units.s16,
    color: Colors.text.secondary,
    fontStyle: "italic",
    paddingVertical: Units.s32,
  },
});
