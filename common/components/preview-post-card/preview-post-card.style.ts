import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: Units.s256,
    backgroundColor: Colors.white,
    borderRadius: Units.s24,
  },
  image: {
    borderTopLeftRadius: Units.s24,
    borderTopRightRadius: Units.s24,
    width: "100%",
    height: Units.s96,
  },
  content: {
    padding: Units.s16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Units.s8,
  },
  url: {
    fontSize: 11,
    color: Colors.text.secondary,
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
    gap: Units.s8,
  },
  tag: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Units.s8,
    paddingVertical: Units.s4,
    borderRadius: Units.s16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
}); 