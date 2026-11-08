import { Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // Same as the Post details back button.
  backButton: {
    position: "absolute",
    left: Units.s16,
    zIndex: 1000,
    width: Units.s40,
    height: Units.s40,
    borderRadius: Units.s20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000073",
  },
});
