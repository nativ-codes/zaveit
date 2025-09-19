import { ACTIVE_OPACITY, TWO_SECONDS, Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import PostImage from "@/common/containers/post-image/post-image";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { formatTimestampToDateString, safelyPrintError } from "@/common/utils";
import { ErrorHandler } from "@/config/errors";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TagItem from "../tag-item/tag-item";
import styles from "./post-details.style";
import { PostDetailsPropsType } from "./post-details.type";

function PostDetails({
  id,
  title,
  author,
  url,
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
        duration: TWO_SECONDS,
        haptic: "success",
      });
    } catch (error) {
      ErrorHandler.logError({
        location: "handleOnCopyToClipboard",
        error: safelyPrintError(error),
      });
    }
  };

  return (
    <Spacer gap="s16">
      <PostImage id={id} style={styles.image} />
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Spacer gap="s8">
          {title && (
            <Text style={GeneralStyles.textTitlePostLargePrimary}>{title}</Text>
          )}
          <Row
            center={
              Boolean(author) ? (
                <Text style={GeneralStyles.textLabelMediumSecondary}>
                  by {author}
                </Text>
              ) : (
                <View />
              )
            }
            right={
              Boolean(timestamp) ? (
                <Text
                  style={StyleSheet.compose(
                    GeneralStyles.textLabelMediumSecondary,
                    GeneralStyles.textRight
                  )}
                >
                  Added on {formatTimestampToDateString(timestamp)}
                </Text>
              ) : null
            }
          />
        </Spacer>
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleOnCopyToClipboard}
        >
          <Row
            center={
              <Text style={GeneralStyles.textLink} numberOfLines={2}>
                {url}
              </Text>
            }
            right={
              <Icon
                name="content-copy"
                size={Units.s24}
                color={Colors.primary}
              />
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
      </Spacer>
    </Spacer>
  );
}

export default memo(PostDetails);
