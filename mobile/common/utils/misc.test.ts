import { expect, it } from "@jest/globals";
import { Platform } from "react-native";
import { getNavBarOffset } from "./misc";

it("adds space only above the Android 3-button nav bar", () => {
  Platform.OS = "android";
  expect(getNavBarOffset(48)).toBe(16); // 3-button
  expect(getNavBarOffset(24)).toBe(0); // gesture
  Platform.OS = "ios";
  expect(getNavBarOffset(48)).toBe(0);
});
