import { expect, it, jest } from "@jest/globals";
import * as ExpoHaptics from "expo-haptics";
import { Haptics } from "./haptics";

jest.mock("expo-haptics");

it("ignores devices without haptic hardware", async () => {
  jest
    .mocked(ExpoHaptics.selectionAsync)
    .mockRejectedValue(new Error("unavailable"));

  await expect(Haptics.selection()).resolves.toBeUndefined();
});
