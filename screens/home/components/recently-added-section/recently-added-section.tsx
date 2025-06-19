import {
    HorizontalScrollViewPosts,
    PreviewPostCard,
} from "@/common/components";
import { useRecentlyAddedPosts } from "@/config/storage/persistent";
import React from "react";
import { RecentlyAddedSectionPropsType } from "./recently-added-section.type";

function RecentlyAddedSection({ onPostPress }: RecentlyAddedSectionPropsType) {
  const posts = useRecentlyAddedPosts();

  return (
    <HorizontalScrollViewPosts
      Element={PreviewPostCard}
      title="Recently Added"
      posts={posts}
      onPostPress={onPostPress}
    />
  );
}

export default RecentlyAddedSection;
