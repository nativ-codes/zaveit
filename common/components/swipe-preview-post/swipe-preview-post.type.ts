import { PostType } from "@/types";

export type SwipePreviewPostPropsType = {
  post: PostType;
  onPress: () => void;
  onRemove: () => void;
};
