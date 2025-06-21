import { Colors } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  card: {
    ...GeneralStyles.actionableContent,
    ...GeneralStyles.shadow,
    backgroundColor: Colors.surface.primary,
  },
});
