import { StyleSheet } from "react-native";

import { TextVariantEnum } from "./text.type";

export default StyleSheet.create({
  [`text_variant_${TextVariantEnum["title-screen"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 30,
    lineHeight: 40,
  },
  [`text_variant_${TextVariantEnum["title-section"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  [`text_variant_${TextVariantEnum["title-sub-section"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["title-body"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: -0.25,
  },
  [`text_variant_${TextVariantEnum["title-group"]}`]: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 13,
    lineHeight: 20,
  },
  [`text_variant_${TextVariantEnum["body-large"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  [`text_variant_${TextVariantEnum["body-large-bold"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  [`text_variant_${TextVariantEnum["body-default"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["body-default-bold"]}`]: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["body-small"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  [`text_variant_${TextVariantEnum["body-small-bold"]}`]: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 13,
    lineHeight: 16,
  },
  [`text_variant_${TextVariantEnum["subtext-large"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["subtext-medium"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["subtext-small"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["label-large"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  [`text_variant_${TextVariantEnum["label-medium"]}`]: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  [`text_variant_${TextVariantEnum["label-small"]}`]: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  [`text_variant_${TextVariantEnum["overline-large"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.75,
  },
  [`text_variant_${TextVariantEnum["overline-small"]}`]: {
    fontFamily: "DMSans-Regular",
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.75,
  }
});
