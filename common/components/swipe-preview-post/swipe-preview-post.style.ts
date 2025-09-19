import { Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    marginLeft: Units.s16,
  },
  removeButton: {
    backgroundColor: Colors.error,
    width: Units.s64,
    height: "100%",
    borderRadius: Units.s20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
});
