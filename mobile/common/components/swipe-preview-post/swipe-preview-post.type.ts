import { PostType } from "@/types";

export type SwipePreviewPostPropsType = {
  post: PostType;
  onPress: () => void;
  onRemove: () => void;
  // Gets a function that closes this row, so the list can close it when scrolling starts.
  onOpen?: (close: () => void) => void;
};
