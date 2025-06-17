import { StyleSheet } from "react-native";
import { Colors, Units } from "../constants";

export const GeneralStyles = StyleSheet.create({
  shadow: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  flex: {
    flex: 1,
  },
  directionRow: {
    flexDirection: "row",
  },
  textTitleScreen: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  textTitleSection: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  textTitleBody: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  textLink: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.primary,
  },
  textBodyLargeSecondary: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  textBodyLargeOnSurface: {
    fontSize: 16,
    color: Colors.text.onSurface,
    fontWeight: "600",
  },
  textBodyMediumSecondary: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  actionableContent: {
    paddingVertical: Units.s20,
    paddingHorizontal: Units.s16,
    borderRadius: Units.s24,
  },
});