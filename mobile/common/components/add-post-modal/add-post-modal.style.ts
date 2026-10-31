import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
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
    flexDirection: "column",
  },
  buttonContainer: {
    height: Units.s64,
  },
});
