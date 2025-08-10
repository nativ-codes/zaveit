import { PostType } from "@/types";

export type PreviewPostTilePropsType = Pick<
  PostType,
  "url" | "title" | "thumbnail" | "id"
> & {
  onPress?: () => void;
};
