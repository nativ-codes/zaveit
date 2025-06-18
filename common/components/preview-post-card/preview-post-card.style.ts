import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: Units.s256,
    backgroundColor: Colors.surface.primary,
    borderRadius: Units.s24,
  },
  image: {
    borderTopLeftRadius: Units.s24,
    borderTopRightRadius: Units.s24,
    width: "100%",
    height: Units.s96,
  },
  urlContainer: {
    position: "absolute",
    top: Units.s8,
    left: Units.s8,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Units.s12,
    paddingVertical: Units.s8,
    borderRadius: Units.s16,
    opacity: 0.9,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -Units.s8
  },
}); 