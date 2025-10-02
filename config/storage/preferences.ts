import { PreferencesType } from "@/types/preferences";
import { storage } from "./storage";

export const getIsAnalyticsEnabledFromPreferences = (
  preferences: PreferencesType
): boolean => {
  return (
    preferences.isAnalyticsEnabled ||
    preferences.isAnalyticsEnabled === undefined
  );
};

export const getPreferences = (): PreferencesType => {
  const preferencesRaw = storage.getString("preferences");
  return preferencesRaw
    ? JSON.parse(preferencesRaw)
    : { isAnalyticsEnabled: undefined };
};

export const setIsAnalyticsEnabled = (isAnalyticsEnabled: boolean): void => {
  const preferences = getPreferences();
  preferences.isAnalyticsEnabled = isAnalyticsEnabled;
  storage.set("preferences", JSON.stringify(preferences));
};

export const getIsAnalyticsEnabled = (): boolean => {
  const preferences = getPreferences();
  return getIsAnalyticsEnabledFromPreferences(preferences);
};
