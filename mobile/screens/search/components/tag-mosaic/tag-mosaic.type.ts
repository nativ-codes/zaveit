import { PostType } from "@/types";

export type TagMosaicPropsType = {
  tags: string[];
  posts: PostType[];
  onTagPress: (tag: string) => void;
};
