import { PostType } from "@/types";

export type PreviewPostCardPropsType = Pick<
  PostType,
  "url" | "title" | "thumbnail" | "tags"
> & {
  onPress: () => void;
};