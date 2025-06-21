import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: Units.s256,
    borderRadius: Units.s24,
    flexDirection: "row",
    backgroundColor: Colors.surface.primary,
    ...GeneralStyles.shadow,
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
  },
});
