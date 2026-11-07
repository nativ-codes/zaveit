import { Units } from "@/common/constants";
import { StyleSheet } from "react-native";

const TILE_SIZE = 104;

export default StyleSheet.create({
  content: {
    gap: Units.s12,
    paddingHorizontal: Units.s16,
  },
  tile: {
    width: TILE_SIZE,
    gap: Units.s6,
  },
  image: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: Units.s16,
  },
});
