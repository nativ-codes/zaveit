import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: Units.s64,
    gap: Units.s16,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  disabled: {
    opacity: 0.7,
  },
  emptyView: {
    width: Units.s24,
  },
});