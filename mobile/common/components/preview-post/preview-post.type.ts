import { PostType } from "@/types";

export type PreviewPostPropsType = Pick<
  PostType,
  "url" | "thumbnailUrl" | "title" | "id" | "tags"
> & {
  onPress?: () => void;
};
