import { PostType } from "@/types";

export type PreviewPostTilePropsType = Pick<
  PostType,
  "url" | "thumbnailUrl" | "title" | "id"
> & {
  onPress?: () => void;
};
