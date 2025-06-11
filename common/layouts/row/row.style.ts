import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  center: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
});
