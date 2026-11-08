import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    height: 220,
    marginHorizontal: Units.s16,
    borderRadius: Units.s24,
    overflow: "hidden",
    backgroundColor: Colors.surface.tertiary,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  // Darkens the thumbnail so the white title stays readable on any image.
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#19202D88",
  },
  content: {
    position: "absolute",
    left: Units.s16,
    right: Units.s16,
    bottom: Units.s16,
    gap: Units.s6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Units.s4,
    paddingHorizontal: Units.s8,
    paddingVertical: Units.s3,
    borderRadius: Units.s8,
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  shuffleButton: {
    position: "absolute",
    top: Units.s16,
    right: Units.s16,
    width: Units.s48,
    height: Units.s48,
    borderRadius: Units.s24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  domain: {
    color: "#FFFFFFBB",
    fontSize: 13,
  },
});
