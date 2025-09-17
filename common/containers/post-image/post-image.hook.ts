import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { updateThumbnail } from "@/common/utils";
import { useThumbnailUrl } from "@/config/storage";
import { useEffect, useState } from "react";

export const useTryThumbnailUrl = (id: string): string => {
  const [updatedThumbnailUrl, setUpdatedThumbnailUrl] = useState(IMAGE_PLACEHOLDER);
  const { url: thumbnailUrl } = useThumbnailUrl(id) || {};

  useEffect(() => {
    if (!thumbnailUrl) {
      updateThumbnail(id).then(setUpdatedThumbnailUrl);
    }
  }, [id, thumbnailUrl]);

  return thumbnailUrl || updatedThumbnailUrl;
};
