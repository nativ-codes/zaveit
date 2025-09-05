import { PostType } from "@/types";

export type PreviewPostCardPropsType = Pick<
  PostType,
  "url" | "title" | "tags" | "id"
> & {
  onPress: () => void;
};