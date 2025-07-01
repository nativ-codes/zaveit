import { Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  image: {
    width: "100%",
    height: Units.s200,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  mainTagsContainer: {
    marginHorizontal: -Units.s16,
  }
}); 