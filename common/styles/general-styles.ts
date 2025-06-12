import { StyleSheet } from "react-native";
import { Colors } from "../constants";

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
});