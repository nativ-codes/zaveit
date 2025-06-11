import { MAX_TAGS_LENGTH } from "@/common/constants";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { getDomainFromUrl } from "@/common/utils/formatters";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./preview-post.style";
import { PreviewPostPropsType } from "./preview-post.type";

function PreviewPost({
  url,
  title,
  thumbnail,
  tags,
  onPress,
}: PreviewPostPropsType) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={ACTIVE_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${title || url}`}
    >
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel="Thumbnail image"
        />
      )}

      <View style={styles.content}>
        {title && (
          <Text
            numberOfLines={3}
            style={styles.title}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        <Text
          style={styles.url}
          numberOfLines={3}
          accessibilityLabel={`URL: ${getDomainFromUrl(url)}`}
        >
          {getDomainFromUrl(url)}
        </Text>

        {tags?.length > 0 && (
          <View style={styles.tagsContainer} accessibilityLabel="Tags">
            {tags.slice(0, MAX_TAGS_LENGTH).map((tag, index) => (
              <View
                key={index}
                style={styles.tag}
                accessibilityLabel={`Tag: ${tag}`}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {tags.length > MAX_TAGS_LENGTH && (
              <View
                style={{
                  paddingHorizontal: Units.s8,
                  paddingVertical: Units.s4,
                }}
                accessibilityLabel={`Tag: +${
                  tags.length - MAX_TAGS_LENGTH
                } more`}
              >
                <Text style={styles.tagText}>
                  +{tags.length - MAX_TAGS_LENGTH} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default PreviewPost;
