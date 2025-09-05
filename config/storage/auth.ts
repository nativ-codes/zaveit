import { AppAuthType } from "@/types";
import { v4 as uuid } from "uuid";
import { storage } from "./storage";

export const getAppAuthType = (): AppAuthType => {
  const appAuthType = storage.getString("appAuthType");

  return appAuthType as AppAuthType;
};

export const setAppAuthType = (appAuthType?: AppAuthType) => {
  storage.set("appAuthType", appAuthType || "");
};

export const setInitialUserId = () => {
  const newUserId = uuid();
  console.log("newUserId", newUserId, storage);
  storage.set("userId", newUserId);

  return newUserId;
};

export const getUserId = (): string => {
  const userId = storage.getString("userId") || setInitialUserId();

  return userId;
};
