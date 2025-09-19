import { PreviewPostTile } from "@/common/components";
import HorizontalScrollViewPosts from "@/common/components/horizontal-scrollview-posts/horizontal-scrollview-posts";
import { Units } from "@/common/constants/units";
import { useRouter } from "expo-router";
import React from "react";
import { getPostsForTag } from "../../search.util";
import { TagPostsListPropsType } from "./tag-posts-list.type";

function TagPostsList({ tags, posts }: TagPostsListPropsType) {
  const router = useRouter();

  const renderTagSection = (tag: string) => {
    const tagPosts = getPostsForTag({ posts, tag });
    if (tagPosts.length === 0) return null;

    return (
      <HorizontalScrollViewPosts
        key={tag}
        title={`#${tag.toLowerCase()}`}
        posts={tagPosts}
        Element={PreviewPostTile}
        onViewAll={() => {
          router.push({
            pathname: "/view-posts",
            params: { tag },
          });
        }}
        onPostPress={(id: string) => {
          router.push({
            pathname: "/post-details",
            params: { id },
          });
        }}
        estimatedItemSize={Units.s256}
      />
    );
  };

  if (tags.length === 0) {
    return null;
  }

  return tags.map(renderTagSection);
}

export default TagPostsList;
