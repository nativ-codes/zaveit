import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { updateThumbnail } from "@/common/utils";
import { useThumbnailUrl } from "@/config/storage";
import { useEffect, useState } from "react";

type UseTryThumbnailUrlReturnType = {
  uri: string;
  onError: () => void;
};

export const useTryThumbnailUrl = (
  id: string
): UseTryThumbnailUrlReturnType => {
  const [updatedThumbnailUrl, setUpdatedThumbnailUrl] =
    useState('');
  const { url: thumbnailUrl } = useThumbnailUrl(id) || {};

  useEffect(() => {
    if (!thumbnailUrl) {
      updateThumbnail(id).then(setUpdatedThumbnailUrl);
    }
  }, [id, thumbnailUrl]);

  return {
    uri: updatedThumbnailUrl || thumbnailUrl,
    onError: () => setUpdatedThumbnailUrl(IMAGE_PLACEHOLDER)
  };
};
