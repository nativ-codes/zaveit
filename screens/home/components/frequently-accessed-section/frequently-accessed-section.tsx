import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { Units } from "@/common/constants";
import { useFrequentlyAccessedPosts } from "@/config/storage/persistent";
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
        estimatedItemSize={Units.s256}
        shouldDisplayCount={false}
      />
    )
  );
}

export default FrequentlyAccessedSection;
