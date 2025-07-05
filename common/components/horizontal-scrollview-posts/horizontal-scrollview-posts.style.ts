import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: Units.s16,
  },
  itemSeparator: {
    width: Units.s16,
  },
});
