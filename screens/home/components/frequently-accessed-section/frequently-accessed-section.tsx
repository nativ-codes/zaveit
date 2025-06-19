import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { useFrequentlyAccessedPosts } from "@/config/storage/persistent";
import React from "react";
import { FrequentlyAccessedSectionPropsType } from "./frequently-accessed-section.type";

function FrequentlyAccessedSection({
  onPostPress,
}: FrequentlyAccessedSectionPropsType) {
  const posts = useFrequentlyAccessedPosts();

  return (
    <HorizontalScrollViewPosts
      Element={PreviewPostCard}
      title="Frequently Accessed"
      posts={posts}
      onPostPress={onPostPress}
    />
  );
}

export default FrequentlyAccessedSection;
