import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
} from "@/common/components";
import { Units } from "@/common/constants/units";
import { useRecentlyAddedPosts } from "@/config/storage/persistent";
import React from "react";
import { RecentlyAddedSectionPropsType } from "./recently-added-section.type";

function RecentlyAddedSection({ onPostPress }: RecentlyAddedSectionPropsType) {
  const posts = useRecentlyAddedPosts();

  return Boolean(posts.length) && (
    <HorizontalScrollViewPosts
      Element={PreviewPostCard}
      title="Recently Added"
      posts={posts}
      onPostPress={onPostPress}
      estimatedItemSize={Units.s256}
      shouldDisplayCount={false}
    />
  );
}

export default RecentlyAddedSection;
