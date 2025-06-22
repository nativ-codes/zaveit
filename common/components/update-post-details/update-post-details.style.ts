import { Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  image: {
    width: "100%",
    height: 200,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  mainTagsContainer: {
    marginHorizontal: -Units.s16,
  }
}); 