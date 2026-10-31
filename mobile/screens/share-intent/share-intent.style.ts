import { Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  topBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topBarButton: {
    borderRadius: Units.s12,
    borderWidth: Units.s1,
    borderColor: Colors.background.primary,
    backgroundColor: Colors.black20,
    padding: Units.s8,
  },
});