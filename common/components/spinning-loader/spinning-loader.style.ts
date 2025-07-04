import { Colors } from "@/common/constants/colors";
import { StyleSheet } from "react-native";
import { SpinningLoaderSizeEnum, SpinningLoaderSizeMap } from "./spinning-loader.type";

export const createSpinningLoaderStyles = (
  size: keyof typeof SpinningLoaderSizeEnum,
  color: string
) =>
  StyleSheet.create({
    container: {
      width: SpinningLoaderSizeMap[size],
      height: SpinningLoaderSizeMap[size],
      justifyContent: "center",
      alignItems: "center",
    },
    circle: {
      width: SpinningLoaderSizeMap[size],
      height: SpinningLoaderSizeMap[size],
      borderRadius: SpinningLoaderSizeMap[size] / 2,
      borderWidth: size === SpinningLoaderSizeEnum.small ? 2 : 3,
      borderColor: color,
      borderTopColor: Colors.transparent,
    },
  }); 