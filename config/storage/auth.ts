import { AppAuthType } from "@/types";
import { v4 as uuid } from "uuid";
import { storage } from "./storage";

export const getAppAuthType = (): AppAuthType => {
  const appAuthType = storage.getString("appAuthType");

  console.log(">> ! getAppAuthType", appAuthType);

  return appAuthType as AppAuthType;
};

export const setAppAuthType = (appAuthType?: AppAuthType) => {
  storage.set("appAuthType", appAuthType || "");
  console.log(">> ! setAppAuthType", storage);
};

export const setInitialUserId = () => {
  const newUserId = uuid();
  // storage.set("userId", newUserId);
  console.log("newUserId", storage);

  return newUserId;
};

export const getUserId = (): string => {
  const userId = storage.getString("userId") || setInitialUserId();

  return userId;
};
