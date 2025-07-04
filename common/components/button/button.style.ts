import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: Units.s64,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    backgroundColor: Colors.primaryDisabled,
  },
}); 