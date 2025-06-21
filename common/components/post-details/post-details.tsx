import { ACTIVE_OPACITY, Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { formatTimestampToDateString } from "@/common/utils";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import TagItem from "../tag-item/tag-item";
import styles from "./post-details.style";
import { PostDetailsPropsType } from "./post-details.type";

function PostDetails({
  title,
  author,
  url,
  thumbnail,
  tags,
  timestamp,
}: PostDetailsPropsType) {
  const handleOnTagPress = (tag: string) => {
    router.push({
      pathname: "/view-posts",
      params: { tag },
    });
  };

  const handleOnCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(url);

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
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Spacer gap="s8">
          {title && (
            <Text style={GeneralStyles.textTitlePostLargePrimary}>{title}</Text>
          )}
          {author && (
            <Text style={GeneralStyles.textLabelMediumSecondary}>
              Author: {author}
            </Text>
          )}
        </Spacer>
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleOnCopyToClipboard}
        >
          <Row
            center={<Text style={GeneralStyles.textLink}>{url}</Text>}
            right={
              <Icon name="content-copy" size={Units.s24} color={Colors.primary} />
            }
          />
        </TouchableOpacity>

        {tags && tags.length > 0 && (
          <Spacer style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                isSelected={false}
                onPress={() => handleOnTagPress(tag)}
              />
            ))}
          </Spacer>
        )}

        {timestamp && (
          <Spacer direction="top" size="s32">
            <Text
              style={StyleSheet.compose(
                GeneralStyles.textLabelMediumSecondary,
                GeneralStyles.textRight
              )}
            >
              Added on {formatTimestampToDateString(timestamp)}
            </Text>
          </Spacer>
        )}
      </Spacer>
    </Spacer>
  );
}

export default PostDetails;
