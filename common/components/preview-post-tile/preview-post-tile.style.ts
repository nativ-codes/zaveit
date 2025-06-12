import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: Units.s256,
    borderRadius: Units.s24,
    flexDirection: "row",
    backgroundColor: Colors.white
  },
  image: {
    width: Units.s88,
    height: Units.s88,
    borderTopLeftRadius: Units.s24,
    borderBottomLeftRadius: Units.s24,
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    padding: Units.s8,
    gap: Units.s4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  url: {
    fontSize: Units.s12,
    color: Colors.text.secondary,
  },
});
