import { PostType } from "@/types";
import { ReactNode } from "react";

// Add Post shows a Post before it has an id, timestamp or Tags.
export type PostDetailsPropsType = Omit<PostType, "id" | "timestamp" | "tags"> &
  Partial<Pick<PostType, "timestamp" | "tags">> & {
    // Called with the Thumbnail URL that failed to load.
    onImageError?: (thumbnailUrl?: string) => void;
    // Rendered under the link, e.g. Add Post's Tag picking.
    children?: ReactNode;
  };
