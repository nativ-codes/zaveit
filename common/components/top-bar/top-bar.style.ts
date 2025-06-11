import { StyleSheet } from "react-native";

import { Units } from "@/common/constants";

export default StyleSheet.create({
  container: {
    paddingHorizontal: Units.s20,
    height: Units.s56,
  },
  column: {
    alignSelf: "center",
    justifyContent: "center",
  },
  left: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
