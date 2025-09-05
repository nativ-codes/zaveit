import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { styles } from "./preview-post-tile.style";
import { PreviewPostTilePropsType } from "./preview-post-tile.type";

function PreviewPostTile({
  id,
  url,
  title,
  onPress,
}: PreviewPostTilePropsType) {
  const domain = getDomainFromUrl(url);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={ACTIVE_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${title || url}`}
    >
      <PostImage id={id} style={styles.image} />

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