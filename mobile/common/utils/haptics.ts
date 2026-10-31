import * as ExpoHaptics from "expo-haptics";

// Some devices have no haptic hardware; feedback must never break the action itself.
const play = (haptic: Promise<void>) => haptic.catch(() => {});

export const Haptics = {
  success: () =>
    play(
      ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Success
      )
    ),
  warning: () =>
    play(
      ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Warning
      )
    ),
  error: () =>
    play(
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error)
    ),
  light: () =>
    play(ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light)),
  medium: () =>
    play(ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium)),
  selection: () => play(ExpoHaptics.selectionAsync()),
};
