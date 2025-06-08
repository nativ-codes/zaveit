import { StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export const GeneralStyles = StyleSheet.create({
  shadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});