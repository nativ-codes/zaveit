import { Button, PostDetails, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  increasePostAccessCount,
  removePost,
  usePosts
} from "@/config/storage/persistent";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { getPostDetails } from "../search/search.util";
import styles from "./[id].style";
import { PostDetailsPropsType } from "./[id].type";

function PostDetailsScreen() {
  const { id } = useLocalSearchParams<PostDetailsPropsType>();
  const posts = usePosts();
  const post = getPostDetails({ posts, id });
  console.log("post", post);

  useEffect(() => {
    if (post) {
      increasePostAccessCount(post.id);
    }
  }, [post]);

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Share intent not found</Text>
      </View>
    );
  }

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
      footer={
        <Spacer
          style={GeneralStyles.directionRow}
          gap="s16"
          direction="horizontal"
          size="s16"
        >
          <Button.Icon iconName="trash" onPress={handleOnRemovePost} theme="error" />
          <Button label="Open" onPress={handleOpenInBrowser} />
        </Spacer>
      }
    >
      <TopBar hasBackButton />
      <PostDetails {...post} />
    </ScreenLayout>
  );
}

export default PostDetailsScreen;
