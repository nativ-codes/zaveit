import { PreviewPost, TopBar } from "@/common/components";
import { ACTIVE_OPACITY } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { Spacer, TabLayout } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { usePosts } from "@/config/storage/persistent";
import { StoredPost } from "@/types";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity } from "react-native";
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

  const renderItem = (post: StoredPost) => (
    <PreviewPost
      key={post.id}
      url={post.url}
      title={post.title}
      thumbnail={post.thumbnail}
      tags={post.tags}
      onPress={() =>
        router.push({
          pathname: "/share-intent/[id]",
          params: { id: post.id },
        })
      }
    />
  );

  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={
            <TouchableOpacity
              activeOpacity={ACTIVE_OPACITY}
              onPress={router.back}
              hitSlop={Units.s16}
              style={GeneralStyles.backTopBarButton}
            >
              <Icon
                name={"chevron-left"}
                size={Units.s24}
                color={Colors.text.primary}
              />
            </TouchableOpacity>
          }
        />
      </Spacer>
      <Spacer direction={["left", "bottom"]} size={"s16"}>
        <Text style={GeneralStyles.textTitleSection}>{`#${tag}`}</Text>
      </Spacer>

      <Spacer direction="horizontal" size="s16" gap="s16">
        {filteredPosts.map(renderItem)}
      </Spacer>
    </TabLayout>
  );
}

export default ViewPostsScreen;
