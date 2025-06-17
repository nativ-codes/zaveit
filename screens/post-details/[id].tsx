import { PostDetails, TopBar } from "@/common/components";
import { TabLayout } from "@/common/layouts";
import { usePosts } from "@/config/storage/persistent";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
    <TabLayout>
      <TopBar hasBackButton />
      <PostDetails
        id={post.id}
        title={post.title}
        author={post.author}
        url={post.url}
        thumbnail={post.thumbnail}
        tags={post.tags}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleOpenInBrowser}>
          <Text style={styles.buttonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    </TabLayout>
  );
}

export default PostDetailsScreen;
