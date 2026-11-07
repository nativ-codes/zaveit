import { PostType } from "@/types";

export type PreviewPostPropsType = Pick<
  PostType,
  "url" | "thumbnailUrl" | "title" | "id" | "tags"
> & {
  // Gets the id, so a list can pass one stable handler and the memo holds.
  onPress?: (id: string) => void;
};
