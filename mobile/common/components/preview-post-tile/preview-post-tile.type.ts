import { PostType } from "@/types";

export type PreviewPostTilePropsType = Pick<
  PostType,
  "url" | "title" | "id"
> & {
  onPress?: () => void;
};
