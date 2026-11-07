import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

const IMAGE_SIZE = Units.s64;

export default StyleSheet.create({
  card: {
    marginHorizontal: Units.s16,
    paddingHorizontal: Units.s12,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s12,
    paddingVertical: Units.s12,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Units.s12,
  },
  text: {
    flex: 1,
    gap: Units.s4,
  },
  // Starts after the thumbnail so the rows read as one list.
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: IMAGE_SIZE + Units.s12,
    backgroundColor: Colors.skeleton,
  },
});
