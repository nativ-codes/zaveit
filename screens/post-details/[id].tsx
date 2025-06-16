import { PostDetails, TopBar } from "@/common/components";
import { TabLayout } from "@/common/layouts";
import { usePosts } from "@/config/storage/persistent";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
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

  return (
    <TabLayout>
      <TopBar hasBackButton />
      <PostDetails post={post} />
    </TabLayout>
  );
}

export default PostDetailsScreen;
