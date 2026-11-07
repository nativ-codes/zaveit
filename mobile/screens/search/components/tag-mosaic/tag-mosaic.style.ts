import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Units.s12,
  },
  tile: {
    width: "48.3%",
    height: 120,
    borderRadius: Units.s16,
    overflow: "hidden",
    backgroundColor: Colors.surface.tertiary,
  },
  // The most used Tag leads the grid at full width.
  tileWide: {
    width: "100%",
    height: 160,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  // Darkens the cover so the white text stays readable on any thumbnail.
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#19202D80",
  },
  text: {
    position: "absolute",
    left: Units.s12,
    right: Units.s12,
    bottom: Units.s12,
  },
  tag: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  count: {
    color: "#FFFFFFBB",
    fontSize: 13,
  },
});
