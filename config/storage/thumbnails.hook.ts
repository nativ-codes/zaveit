import { ThumbnailType } from "@/types/posts";
import { useMemo } from "react";
import { getThumbnailUrl } from "./thumbnails";

export const useThumbnailUrl = (id: string): ThumbnailType => {
  return useMemo(() => getThumbnailUrl(id), [id]);
};
