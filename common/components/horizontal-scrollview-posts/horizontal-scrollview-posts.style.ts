import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Units.s16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  seeAllButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.primary,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    padding: Units.s16,
    gap: Units.s16,
  },
});
