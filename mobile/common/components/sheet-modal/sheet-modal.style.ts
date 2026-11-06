import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: Units.s24,
    marginHorizontal: Units.s16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Units.s8,
    height: Units.s64,
  },
  // Fixed width: Button flexes, so beside another it would take half the row.
  secondaryButton: {
    width: Units.s88,
  },
});
