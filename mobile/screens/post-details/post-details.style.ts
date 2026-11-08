import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  errorContainer: {
    marginTop: '60%',
    justifyContent: "center",
    alignItems: "center",
  },
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
  // Sits on the bottom-left corner of the Post image (Units.s400 tall), styled like Home's shuffle button; the domain badge takes the bottom-right.
  reloadButton: {
    position: "absolute",
    top: Units.s400 - Units.s36 - Units.s12,
    left: Units.s12,
    zIndex: 1000,
    width: Units.s36,
    height: Units.s36,
    borderRadius: Units.s36 / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  reloadButtonDisabled: {
    opacity: 0.5,
  },
});