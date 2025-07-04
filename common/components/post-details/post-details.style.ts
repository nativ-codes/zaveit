import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  image: {
    width: "100%",
    height: Units.s400,
  },
  tagsContainer: {
    marginLeft: -Units.s12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
