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
  backTopBarButton: {
    marginLeft: -Units.s8,
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
  textLink: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.primary,
  },
});