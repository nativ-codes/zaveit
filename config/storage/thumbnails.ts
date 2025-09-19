import { ThumbnailType } from "@/types/posts";
import { storage } from "./storage";

export const setThumbnailUrl = ({ id, url }: ThumbnailType): void => {
  const thumbnailData = JSON.stringify({ id, url });

  storage.set(`thumbnailUrls.${id}`, thumbnailData);
};

export const removeThumbnailUrl = (id: string): void => {
  storage.delete(`thumbnailUrls.${id}`);
};
