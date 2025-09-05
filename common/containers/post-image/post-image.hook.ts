import { updateThumbnail } from "@/common/utils";
import { useThumbnailUrl } from "@/config/storage";
import { useEffect } from "react";

export const useTryThumbnailUrl = (id: string): string => {
  const { url: thumbnailUrl } = useThumbnailUrl(id) || {};

  useEffect(() => {
    if (!thumbnailUrl) {
      updateThumbnail(id);
    }
  }, [id, thumbnailUrl]);

  return thumbnailUrl;
};
