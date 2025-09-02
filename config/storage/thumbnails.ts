import { ThumbnailType, ThumbnailUrlsType } from "@/types/posts";
import { storage } from "./storage";

export const getThumbnailUrls = (): ThumbnailUrlsType => {
  const posts = storage.getString("thumbnailUrls");
  return posts ? JSON.parse(posts) : {};
};

export const getThumbnailUrl = (id: string): ThumbnailType => {
  const thumbnailUrls = getThumbnailUrls();
  return thumbnailUrls[id];
};

export const setThumbnailUrl = ({ id, url }: ThumbnailType): void => {
  const thumbnailUrls = getThumbnailUrls();
  thumbnailUrls[id] = { id, url };
  storage.set("thumbnailUrls", JSON.stringify(thumbnailUrls));
};

export const removeThumbnailUrl = (id: string): void => {
  const thumbnailUrls = getThumbnailUrls();
  delete thumbnailUrls[id];
  storage.set("thumbnailUrls", JSON.stringify(thumbnailUrls));
};
