import { PostType } from "@/types";

export type PreviewPostPropsType = Pick<
  PostType,
  "url" | "title" | "id" | "tags"
> & {
  onPress?: () => void;
};
