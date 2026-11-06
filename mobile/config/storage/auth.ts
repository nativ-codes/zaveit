import { v4 as uuid } from "uuid";
import { storage } from "./storage";

// The key of the removed "Continue without account" mode (ADR 0004), still read to explain the change.
const OLD_AUTH_TYPE_KEY = "appAuthType";

export const isFormerSignedOutUser = (): boolean =>
  storage.getString(OLD_AUTH_TYPE_KEY) === "anonymous";

export const forgetFormerSignedOutUser = () => {
  storage.delete(OLD_AUTH_TYPE_KEY);
};

export const setInitialUserId = () => {
  const newUserId = uuid();
  storage.set("userId", newUserId);

  return newUserId;
};

export const getUserId = (): string => {
  const userId = storage.getString("userId") || setInitialUserId();

  return userId;
};
