import { ACTIVE_OPACITY } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import styles from "./post-details.style";
import { PostDetailsPropsType } from "./post-details.type";

function PostDetails({ post }: PostDetailsPropsType) {
  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(post.url);
    } catch (error) {
      console.error("Error opening URL in browser:", error);
    }
  };

  const handleOnCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(post.url);

      Burnt.toast({
        title: "Copied to clipboard.",
        preset: "done",
        duration: 2,
        haptic: "success",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <Spacer gap="s16">
      {post.thumbnail && (
        <Image
          source={{ uri: post.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <Spacer direction="horizontal" size="s16" gap="s16">
        {post.title && (
          <Text style={GeneralStyles.textTitleSection}>{post.title}</Text>
        )}

        {post.author && <Text style={styles.author}>by {post.author}</Text>}

        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleOnCopyToClipboard}
        >
          <Row
            center={<Text style={GeneralStyles.textLink}>{post.url}</Text>}
            right={
              <Icon name="content-copy" size={24} color={Colors.primary} />
            }
          />
        </TouchableOpacity>

        {post.tags?.length > 0 && (
          <Spacer gap="s16" style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <Text key={index} style={GeneralStyles.textBodyLargeSecondary}>
                #{tag}
              </Text>
            ))}
          </Spacer>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleOpenInBrowser}>
            <Text style={styles.buttonText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      </Spacer>
    </Spacer>
  );
}

export default PostDetails;
