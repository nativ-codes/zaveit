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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Units.s16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  clearSearchButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0
  },
});
