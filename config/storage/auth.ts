import { useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "./storage";

export type AppAuthType = "google" | "apple" | "anonymous" | undefined;

export const useAppAuthType = (): AppAuthType => {
  const [appAuthType] = useMMKVString("appAuthType", storage);

  return useMemo(() => appAuthType as AppAuthType, [appAuthType]);
};

export const getAppAuthType = (): AppAuthType => {
  const appAuthType = storage.getString("appAuthType");

  return appAuthType as AppAuthType;
};

export const setAppAuthType = (appAuthType?: AppAuthType) => {
  storage.set("appAuthType", appAuthType || "");
};
