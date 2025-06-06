import { MAX_TAGS_LENGTH } from "@/common/constants";
import { ACTIVITY_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./preview-post-card.style";
import { PreviewPostCardPropsType } from "./preview-post-card.type";

function PreviewPostCard({
  url,
  title,
  thumbnail,
  tags,
  onPress,
}: PreviewPostCardPropsType) {
  const getDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return url;
    }
  };

    
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={ACTIVITY_OPACITY}
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
      <View style={styles.urlContainer}>
        <Text
          style={styles.url}
          numberOfLines={3}
          accessibilityLabel={`URL: ${url}`}
        >
          {getDomainFromUrl(url)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default PreviewPostCard;
