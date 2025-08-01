import { Colors, Units } from "@/common/constants";
import { StyleSheet } from "react-native";
import { ButtonTypeEnum } from "./button.type";

export default StyleSheet.create({
  [`buttonType${ButtonTypeEnum.primary}`]: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: Units.s64,
    alignItems: "center",
    justifyContent: "center",
  },
  [`buttonType${ButtonTypeEnum.ghost}`]: {
    flex: 1,
    backgroundColor: 'transparent',
    height: Units.s64,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    backgroundColor: Colors.primaryDisabled,
  },
}); 