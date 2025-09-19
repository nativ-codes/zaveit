import { EmptyPlaceholder, TopBar } from "@/common/components";
import SwipePreviewPost from "@/common/components/swipe-preview-post/swipe-preview-post";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { removePost, usePosts } from "@/config/storage";
import { PostType } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text } from "react-native";
import { getPostsForTag } from "../search/search.util";
import { ViewPostsPropsType } from "./view-posts.type";

function ViewPostsScreen() {
  const { tag } = useLocalSearchParams<ViewPostsPropsType>();
  const router = useRouter();

  const posts = usePosts();

  const filteredPosts = useMemo(
    () => getPostsForTag({ posts, tag }),
    [posts, tag]
  );

  const renderItem = (post: PostType) => (
    <SwipePreviewPost
      key={post.id}
      post={post}
      onRemove={() => removePost(post)}
      onPress={() =>
        router.push({
          pathname: "/post-details/[id]",
          params: { id: post.id },
        })
      }
    />
  );

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar hasBackButton />
      </Spacer>
      <Spacer direction={["left", "bottom"]} size={"s16"}>
        <Text style={GeneralStyles.textTitleScreenPrimary}>{`#${tag}`}</Text>
      </Spacer>

      <Spacer direction="horizontal" size="s16" gap="s16">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(renderItem)
        ) : (
          <EmptyPlaceholder
            message="No posts found"
            instruction="Try adding more posts"
          />
        )}
      </Spacer>
    </ScreenLayout>
  );
}

export default ViewPostsScreen;
