import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  searchInput: {
    fontSize: 16,
    backgroundColor: Colors.surface.primary,
    color: Colors.text.primary,
    ...GeneralStyles.actionableContent,
    ...GeneralStyles.shadow,
    paddingRight: Units.s64,
    height: Units.s64,
  },
  clearSearchButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0
  },
});
