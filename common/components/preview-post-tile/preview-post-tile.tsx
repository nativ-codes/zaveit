import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl, useRefreshPost } from "@/common/utils";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { styles } from "./preview-post-tile.style";
import { PreviewPostTilePropsType } from "./preview-post-tile.type";

function PreviewPostTile({
  id,
  url,
  title,
  thumbnail,
  onPress,
}: PreviewPostTilePropsType) {
  const onError = useRefreshPost(id);
  const domain = getDomainFromUrl(url);

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
          onError={onError}
        />
      )}

      <Spacer direction="full" size="s8" gap="s4" style={styles.content}>
        {title && (
          <Text
            numberOfLines={3}
            style={GeneralStyles.textTitlePostSmallPrimary}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        <Text
          style={GeneralStyles.textLabelSmallSecondary}
          numberOfLines={1}
          accessibilityLabel={`URL: ${domain}`}
        >
          {domain}
        </Text>
      </Spacer>
    </TouchableOpacity>
  );
}

export default PreviewPostTile; 