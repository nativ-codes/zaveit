import { PreferencesType } from "@/types/preferences";
import { useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getIsAnalyticsEnabledFromPreferences } from "./preferences";
import { storage } from "./storage";

export const usePreferences = (): PreferencesType => {
  const [preferencesRaw] = useMMKVString("preferences", storage);

  return useMemo(() => JSON.parse(preferencesRaw || "{}"), [preferencesRaw]);
};

export const useIsAnalyticsEnabled = (): boolean => {
  const preferences = usePreferences();

  return useMemo(
    () => getIsAnalyticsEnabledFromPreferences(preferences),
    [preferences]
  );
};
