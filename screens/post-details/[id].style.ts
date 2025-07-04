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
  topBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  }
});