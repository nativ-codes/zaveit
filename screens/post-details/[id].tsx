import {
  Button,
  EmptyPlaceholder,
  PostDetails,
  TopBar,
} from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  increasePostAccessCount,
  removePost,
  usePosts,
} from "@/config/storage/persistent";
import { PostType } from "@/types";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPostDetails } from "../search/search.util";
import styles from "./[id].style";
import { PostDetailsPropsType } from "./[id].type";

function PostDetailsScreen() {
  const { id } = useLocalSearchParams<PostDetailsPropsType>();
  const posts = usePosts();
  const post = getPostDetails({ posts, id }) as PostType;
  const insets = useSafeAreaInsets();

  console.log("post", post);

  useEffect(() => {
    if (post) {
      increasePostAccessCount(post.id);
    }
  }, [post]);

  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(post.url);
    } catch (error) {
      console.error("Error opening URL in browser:", error);
    }
  };

  const handleOnRemovePost = () => {
    Alert.alert("Remove Post", "Are you sure you want to remove this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removePost(post);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      hasTopInset={false}
      footer={
        <Spacer
          style={GeneralStyles.directionRow}
          gap="s16"
          direction="horizontal"
          size="s16"
        >
          <Button.Icon
            iconName="trash"
            onPress={handleOnRemovePost}
            theme="error"
          />
          <Button
            type="primary"
            label="Open"
            onPress={handleOpenInBrowser}
          />
        </Spacer>
      }
    >
      <View
        style={StyleSheet.compose(styles.topBarContainer, {
          top: insets.top,
        })}
      >
        <TopBar hasBackButton />
      </View>
      {post ? (
        <PostDetails {...post} />
      ) : (
        <View style={styles.errorContainer}>
          <EmptyPlaceholder
            message="Post not found"
            instruction="Please try again later"
          />
        </View>
      )}
    </ScreenLayout>
  );
}

export default PostDetailsScreen;
