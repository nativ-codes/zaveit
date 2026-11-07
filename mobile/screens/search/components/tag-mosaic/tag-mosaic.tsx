import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getPostsForTag } from "../../search.util";
import styles from "./tag-mosaic.style";
import { TagMosaicPropsType } from "./tag-mosaic.type";

const formatPostCount = (count: number) => `${count} ${count === 1 ? "post" : "posts"}`;

function TagMosaic({ tags, posts, onTagPress }: TagMosaicPropsType) {
  const tiles = useMemo(() => {
    // Each Tag takes a cover no earlier Tag used, so popular Tags don't all show the same thumbnail.
    const usedCoverIds = new Set<string>();
    return tags.map((tag) => {
      const tagPosts = getPostsForTag({ posts, tag });
      const withThumbnail = tagPosts.filter((post) => post.thumbnailUrl);
      const cover = withThumbnail.find((post) => !usedCoverIds.has(post.id)) ?? withThumbnail[0];
      if (cover) usedCoverIds.add(cover.id);
      return { tag, count: tagPosts.length, thumbnailUrl: cover?.thumbnailUrl };
    });
  }, [tags, posts]);

  return (
    <Spacer direction="horizontal" size="s16" gap="s12">
      <Text style={GeneralStyles.textTitleSectionPrimary}>Browse by Tag</Text>
      <View style={styles.grid}>
        {tiles.map(({ tag, count, thumbnailUrl }, index) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tile, index === 0 && styles.tileWide]}
            onPress={() => onTagPress(tag)}
            activeOpacity={ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={`#${tag}, ${formatPostCount(count)}`}
          >
            <PostImage thumbnailUrl={thumbnailUrl} style={styles.image} />
            <View style={styles.scrim} />
            <View style={styles.text}>
              <Text style={styles.tag} numberOfLines={1}>
                #{tag}
              </Text>
              <Text style={styles.count}>{formatPostCount(count)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Spacer>
  );
}

export default TagMosaic;
