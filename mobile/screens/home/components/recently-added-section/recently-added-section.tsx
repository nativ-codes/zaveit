import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { useRecentlyAddedPosts } from "@/config/storage";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SectionTitle from "../section-title/section-title";
import styles from "./recently-added-section.style";
import { RecentlyAddedSectionPropsType } from "./recently-added-section.type";

const MAX_RECENT_POSTS = 5;

function RecentlyAddedSection({ onPostPress }: RecentlyAddedSectionPropsType) {
  const posts = useRecentlyAddedPosts().slice(0, MAX_RECENT_POSTS);

  if (!posts.length) {
    return null;
  }

  return (
    <Spacer gap="s8">
      <SectionTitle title="Recently added" icon="clock" />
      <View style={StyleSheet.compose(styles.card, GeneralStyles.shadow)}>
        {posts.map((post, index) => {
          const domain = getDomainFromUrl(post.url);
          return (
            <React.Fragment key={post.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => onPostPress(post.id)}
                activeOpacity={ACTIVE_OPACITY}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${post.title || post.url}`}
              >
                <PostImage thumbnailUrl={post.thumbnailUrl} style={styles.image} />
                <View style={styles.text}>
                  <Text style={GeneralStyles.textTitlePostMediumPrimary} numberOfLines={2}>
                    {post.title || domain}
                  </Text>
                  <Text style={GeneralStyles.textLabelSmallSecondary} numberOfLines={1}>
                    {domain}
                    {post.tags[0] ? `  ·  #${post.tags[0]}` : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </Spacer>
  );
}

export default RecentlyAddedSection;
