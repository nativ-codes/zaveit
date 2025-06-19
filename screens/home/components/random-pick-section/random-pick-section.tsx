import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { useRandomPickPost } from "@/config/storage/persistent";
import React from "react";
import { RandomPickSectionPropsType } from "./random-pick-section.type";

function RandomPickSection({ onPostPress }: RandomPickSectionPropsType) {
  const post = useRandomPickPost();

  if (!post) {
    return null;
  }

  return (
    <HorizontalScrollViewPosts
      Element={PreviewPostCard}
      title="Random Pick"
      posts={[post]}
      onPostPress={onPostPress}
    />
  );
}

export default RandomPickSection;
