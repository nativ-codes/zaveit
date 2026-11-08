import { PostType } from "@/types";

export type PostDetailsPropsType = PostType & {
  // Called with the Thumbnail URL that failed to load.
  onImageError?: (thumbnailUrl?: string) => void;
};
