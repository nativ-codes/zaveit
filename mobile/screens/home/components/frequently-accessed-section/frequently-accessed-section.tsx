import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { useFrequentlyAccessedPosts } from "@/config/storage";
import React from "react";
import { FrequentlyAccessedSectionPropsType } from "./frequently-accessed-section.type";

function FrequentlyAccessedSection({
  onPostPress,
}: FrequentlyAccessedSectionPropsType) {
  const posts = useFrequentlyAccessedPosts();

  return (
    Boolean(posts.length) && (
      <HorizontalScrollViewPosts
        Element={PreviewPostCard}
        title="Frequently Accessed"
        posts={posts}
        onPostPress={onPostPress}
        shouldDisplayCount={false}
      />
    )
  );
}

export default FrequentlyAccessedSection;
