import { PreviewPost, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { usePosts } from "@/config/storage/persistent";
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
    <PreviewPost
      key={post.id}
      url={post.url}
      title={post.title}
      thumbnail={post.thumbnail}
      tags={post.tags}
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
        {filteredPosts.map(renderItem)}
      </Spacer>
    </ScreenLayout>
  );
}

export default ViewPostsScreen;
