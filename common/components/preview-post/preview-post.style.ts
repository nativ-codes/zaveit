import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surface.primary,
    borderRadius: Units.s20,
    alignItems: "center",
  },
  image: {
    borderTopLeftRadius: Units.s20,
    borderBottomLeftRadius: Units.s20,
    width: Units.s128,
    height: "100%",
  },
  content: {
    flex: 1,
  },
  tagsContainer: {
    marginLeft: -Units.s8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
