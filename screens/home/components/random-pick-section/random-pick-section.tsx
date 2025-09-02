import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { Units } from "@/common/constants/units";
import { useRandomPickPost } from "@/config/storage";
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
      estimatedItemSize={Units.s256}
      shouldDisplayCount={false}
    />
  );
}

export default RandomPickSection;
