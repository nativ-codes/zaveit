import { useSyncExternalStore } from "react";
import { storage } from "./storage";

// A link shared while signed out, offered as a Post after sign-in.
const PENDING_POST_KEY = "pendingPostUrl";

// In memory only: the "sign in to save" modal shows when a share arrives, not on every launch.
let justSharedUrl: string | undefined;
const listeners = new Set<() => void>();

const setJustSharedUrl = (url: string | undefined) => {
  justSharedUrl = url;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const keepPendingPost = (url: string) => {
  storage.set(PENDING_POST_KEY, url);
  setJustSharedUrl(url);
};

export const getPendingPost = (): string | undefined =>
  storage.getString(PENDING_POST_KEY);

export const clearPendingPost = () => {
  storage.delete(PENDING_POST_KEY);
  setJustSharedUrl(undefined);
};

export const getJustSharedPost = (): string | undefined => justSharedUrl;

export const dismissJustSharedPost = () => setJustSharedUrl(undefined);

export const useJustSharedPost = (): string | undefined =>
  useSyncExternalStore(subscribe, getJustSharedPost);
