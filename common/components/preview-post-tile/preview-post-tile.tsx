import { ACTIVITY_OPACITY } from "@/common/constants/ui";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./preview-post-tile.style";
import { PreviewPostTilePropsType } from "./preview-post-tile.type";

function PreviewPostTile({
  url,
  title,
  thumbnail,
  onPress,
}: PreviewPostTilePropsType) {
  return (
    <TouchableOpacity
      style={StyleSheet.compose(styles.container, GeneralStyles.shadow)}
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

        <Text
          style={styles.url}
          numberOfLines={1}
          accessibilityLabel={`URL: ${getDomainFromUrl(url)}`}
        >
          {getDomainFromUrl(url)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default PreviewPostTile; 