import { PostType } from "@/types";

export type PreviewPostCardPropsType = Pick<
  PostType,
  "url" | "thumbnailUrl" | "title" | "tags" | "id"
> & {
  onPress: () => void;
};