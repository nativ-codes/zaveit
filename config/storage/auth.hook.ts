import { AppAuthType } from "@/types";
import { useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "./storage";

export const useAppAuthType = (): AppAuthType => {
  const [appAuthType] = useMMKVString("appAuthType", storage);
  console.log(">> ! appAuthType", appAuthType);

  return useMemo(() => appAuthType as AppAuthType, [appAuthType]);
};
