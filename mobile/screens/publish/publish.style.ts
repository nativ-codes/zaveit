import { Colors, SWITCH_TRACK_COLOR, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { StyleSheet } from "react-native";

const field = {
  ...GeneralStyles.actionableContent,
  ...GeneralStyles.shadow,
  height: Units.s64,
  paddingVertical: 0,
  backgroundColor: Colors.surface.primary,
};

// The decided look for publishing switches: primary blue track, white thumb. The shared SWITCH_TRACK_COLOR stays as is.
export const PRIMARY_SWITCH_TRACK = { true: Colors.primary, false: SWITCH_TRACK_COLOR.false };

export default StyleSheet.create({
  usernameField: {
    ...field,
    flexDirection: "row",
    alignItems: "center",
  },
  usernamePrefix: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  usernameInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.text.primary,
  },
  available: {
    color: "#2E9E5B",
  },
  error: {
    color: Colors.error,
  },
  card: {
    gap: Units.s8,
    padding: Units.s16,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.primary,
    ...GeneralStyles.shadow,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s8,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Units.s6,
    alignSelf: "flex-start",
  },
  smallLink: {
    flexShrink: 1,
  },
  smallLinkPath: {
    color: Colors.primary,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    // Read-only medium tags keep the pill padding with no pill, so pull them back to the card edge.
    marginHorizontal: -Units.s12,
  },
  input: {
    ...field,
    paddingHorizontal: Units.s16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  linkBox: {
    padding: Units.s16,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.primary,
    ...GeneralStyles.shadow,
  },
  linkText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  linkPath: {
    color: Colors.primary,
    fontWeight: "700",
  },
  linkPlaceholder: {
    color: Colors.text.placeholder,
  },
  textButton: {
    alignSelf: "center",
  },
  textButtonLabel: {
    color: Colors.primary,
  },
  bleed: {
    marginHorizontal: -Units.s16,
  },
});
