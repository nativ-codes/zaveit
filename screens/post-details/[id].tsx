import { PostDetails, TopBar } from "@/common/components";
import { ACTIVE_OPACITY } from "@/common/constants";
import { Spacer, TabLayout } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { usePosts } from "@/config/storage/persistent";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getPostDetails } from "../search/search.util";
import styles from "./[id].style";
import { PostDetailsPropsType } from "./[id].type";

function PostDetailsScreen() {
  const { id } = useLocalSearchParams<PostDetailsPropsType>();
  const posts = usePosts();
  const post = getPostDetails({ posts, id });

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

  return (
    <TabLayout
      footer={
        <Spacer gap="s16" direction="horizontal" size="s16">
          <TouchableOpacity
            activeOpacity={ACTIVE_OPACITY}
            style={StyleSheet.compose(
              GeneralStyles.actionableContent,
              styles.button
            )}
            onPress={handleOpenInBrowser}
          >
            <Text style={GeneralStyles.textBodyLargeOnSurface}>Open Post</Text>
          </TouchableOpacity>
        </Spacer>
      }
    >
      <TopBar hasBackButton />
      <PostDetails {...post} />
    </TabLayout>
  );
}

export default PostDetailsScreen;
