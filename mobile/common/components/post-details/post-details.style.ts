import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  image: {
    width: "100%",
    height: Units.s400,
  },
  body: {
    padding: Units.s16,
    gap: Units.s16,
  },
  domain: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Units.s6,
    paddingHorizontal: Units.s12,
    paddingVertical: Units.s6,
    borderRadius: Units.s20,
    backgroundColor: Colors.primaryLight,
  },
  domainText: {
    ...GeneralStyles.textLabelMediumSecondary,
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Units.s16,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s6,
    flexShrink: 1,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s12,
    padding: Units.s16,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.secondary,
  },
  tagsContainer: {
    marginLeft: -Units.s12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
