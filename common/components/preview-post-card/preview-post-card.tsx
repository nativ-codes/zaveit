import { MAX_TAGS_LENGTH } from "@/common/constants";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TagItem from "../tag-item/tag-item";
import { styles } from "./preview-post-card.style";
import { PreviewPostCardPropsType } from "./preview-post-card.type";

function PreviewPostCard({
  id,
  url,
  title,
  tags,
  onPress,
}: PreviewPostCardPropsType) {
  const domain = getDomainFromUrl(url);

  return (
    <TouchableOpacity
      style={StyleSheet.compose(styles.container, GeneralStyles.shadow)}
      onPress={onPress}
      activeOpacity={ACTIVE_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${title || url}`}
    >
      <PostImage id={id} style={styles.image} />

      <Spacer direction="full" size="s8" gap="s4">
        {title && (
          <Text
            numberOfLines={3}
            style={GeneralStyles.textTitlePostMediumPrimary}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        {tags && tags.length > 0 && (
          <View style={styles.tagsContainer} accessibilityLabel="Tags">
            {tags.slice(0, MAX_TAGS_LENGTH).map((tag, index) => (
              <TagItem key={index} tag={tag} size="small" isReadOnly />
            ))}
            {tags.length > MAX_TAGS_LENGTH && (
              <TagItem
                tag={`+${tags.length - MAX_TAGS_LENGTH} more`}
                size="small"
                isReadOnly
                shouldUsePrefixedTag={false}
              />
            )}
          </View>
        )}
      </Spacer>
      <View style={styles.urlContainer}>
        <Text
          style={GeneralStyles.textLabelSmallSecondary}
          numberOfLines={1}
          accessibilityLabel={`URL: ${domain}`}
        >
          {domain}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default PreviewPostCard;
