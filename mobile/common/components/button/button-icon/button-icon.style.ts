import { Colors, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.error,
    ...GeneralStyles.actionableContent,
    alignItems: "center",
    justifyContent: "center",
    width: Units.s64,
    height: Units.s64,
  },
});
