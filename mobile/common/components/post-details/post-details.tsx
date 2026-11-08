import { ACTIVE_OPACITY, TWO_SECONDS, Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import PostImage from "@/common/containers/post-image/post-image";
import { GeneralStyles } from "@/common/styles";
import { formatTimestampToDateString, safelyPrintError } from "@/common/utils";
import { getDomainFromUrl } from "@/common/utils/formatters";
import { Haptics } from "@/common/utils/haptics";
import { ErrorHandler } from "@/config/errors";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TagItem from "../tag-item/tag-item";
import styles from "./post-details.style";
import { PostDetailsPropsType } from "./post-details.type";

const handleOnTagPress = (tag: string) => {
  router.push({
    pathname: "/view-posts",
    params: { tag },
  });
};

function PostDetails({
  title,
  author,
  url,
  thumbnailUrl,
  tags,
  timestamp,
  onImageError,
}: PostDetailsPropsType) {
  const handleOnCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(url);

      Burnt.toast({
        title: "Copied to clipboard.",
        preset: "done",
        duration: TWO_SECONDS,
      });
      Haptics.light();
    } catch (error) {
      ErrorHandler.logError({
        location: "handleOnCopyToClipboard",
        error: safelyPrintError(error),
      });
    }
  };

  return (
    <View>
      <PostImage
        thumbnailUrl={thumbnailUrl}
        style={styles.image}
        onError={() => onImageError?.(thumbnailUrl)}
      />
      <View style={styles.body}>
        <View style={styles.domain}>
          <Icon name="web" size={Units.s16} color={Colors.primary} />
          <Text style={styles.domainText}>{getDomainFromUrl(url)}</Text>
        </View>
        {title && (
          <Text style={GeneralStyles.textTitlePostLargePrimary}>{title}</Text>
        )}
        {(Boolean(author) || Boolean(timestamp)) && (
          <View style={styles.metaRow}>
            {Boolean(author) && (
              <View style={styles.meta}>
                <Icon name="account-outline" size={Units.s16} color={Colors.text.secondary} />
                <Text style={GeneralStyles.textLabelMediumSecondary} numberOfLines={1}>
                  {author}
                </Text>
              </View>
            )}
            {Boolean(timestamp) && (
              <View style={styles.meta}>
                <Icon name="calendar-blank-outline" size={Units.s16} color={Colors.text.secondary} />
                <Text style={GeneralStyles.textLabelMediumSecondary}>
                  {formatTimestampToDateString(timestamp)}
                </Text>
              </View>
            )}
          </View>
        )}
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleOnCopyToClipboard}
          style={styles.link}
          accessibilityRole="button"
          accessibilityLabel="Copy link"
        >
          <Icon name="link-variant" size={Units.s20} color={Colors.primary} />
          <Text style={[GeneralStyles.textLink, GeneralStyles.flex]} numberOfLines={1}>
            {url}
          </Text>
          <Icon name="content-copy" size={Units.s20} color={Colors.text.secondary} />
        </TouchableOpacity>

        {tags && tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                isSelected={false}
                onPress={handleOnTagPress}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(PostDetails);
