import { ThumbnailType } from "@/types/posts";
import { useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "./storage";

export const useThumbnailUrl = (id: string): ThumbnailType => {
  const [thumbnailUrl] = useMMKVString(`thumbnailUrls.${id}`, storage);

  return useMemo(
    () => (thumbnailUrl ? JSON.parse(thumbnailUrl) : {}),
    [thumbnailUrl]
  );
};
