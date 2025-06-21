import { StyleSheet } from "react-native";
import { Colors, Units } from "../constants";

export const GeneralStyles = StyleSheet.create({
  shadow: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  flex: {
    flex: 1,
  },
  directionRow: {
    flexDirection: "row",
  },

  /* Text Title Screen */
  textTitleScreenPrimary: {
    fontFamily: "GellixBold",
    fontSize: 24,
    color: Colors.text.primary,
  },

  /* Text Title Section */
  textTitleSectionPrimary: {
    fontFamily: "Gellix",
    fontSize: 20,
    color: Colors.text.primary,
  },

  /* Text Title Post */
  textTitlePostLargePrimary: {
    fontFamily: "GellixBold",
    fontSize: 20,
    color: Colors.text.primary,
  },
  textTitlePostMediumPrimary: {
    fontFamily: "GellixBold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  textTitlePostMediumOnPrimary: {
    fontFamily: "GellixBold",
    fontSize: 16,
    color: Colors.text.onPrimary,
  },
  textTitlePostSmallPrimary: {
    fontFamily: "GellixBold",
    fontSize: 14,
    color: Colors.text.primary,
  },

  /* Text Label */
  textLabelLargePrimary: {
    fontFamily: "Gellix",
    fontSize: 16,
    color: Colors.text.primary,
  },
  textLabelLargeSecondary: {
    fontFamily: "Gellix",
    fontSize: 16,
    color: Colors.text.secondary,
  },
  textLabelMediumSecondary: {
    fontFamily: "Gellix",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  textLabelSmallSecondary: {
    fontFamily: "Gellix",
    fontSize: 12,
    color: Colors.text.secondary,
  },

  /* Text Link */
  textLink: {
    fontFamily: "Gellix",
    fontSize: 15,
    color: Colors.primary,
  },

  /* Text Alignment */
  textRight: {
    textAlign: "right",
  },
  textCenter: {
    textAlign: "center",
  },

  /* Misc */
  actionableContent: {
    paddingVertical: Units.s20,
    paddingHorizontal: Units.s16,
    borderRadius: Units.s24,
  },
});