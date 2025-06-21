import { Colors } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  removePostButton: {
    backgroundColor: Colors.error,
    ...GeneralStyles.actionableContent,
  },
});