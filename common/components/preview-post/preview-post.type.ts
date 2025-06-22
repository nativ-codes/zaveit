import { PostType } from "@/types";

export type PreviewPostPropsType = Pick<
  PostType,
  "url" | "title" | "thumbnail" | "tags"
> & {
  onPress?: () => void;
};
