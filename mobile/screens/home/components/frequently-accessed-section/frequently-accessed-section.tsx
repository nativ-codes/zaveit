import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { useFrequentlyAccessedPosts } from "@/config/storage";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import SectionTitle from "../section-title/section-title";
import styles from "./frequently-accessed-section.style";
import { FrequentlyAccessedSectionPropsType } from "./frequently-accessed-section.type";

function FrequentlyAccessedSection({ onPostPress }: FrequentlyAccessedSectionPropsType) {
  const posts = useFrequentlyAccessedPosts();

  if (!posts.length) {
    return null;
  }

  return (
    <Spacer gap="s16">
      <SectionTitle title="Most opened" icon="trending-up" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.tile}
            onPress={() => onPostPress(post.id)}
            activeOpacity={ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${post.title || post.url}`}
          >
            <PostImage thumbnailUrl={post.thumbnailUrl} style={styles.image} />
            <Text style={GeneralStyles.textLabelSmallSecondary} numberOfLines={2}>
              {post.title || getDomainFromUrl(post.url)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Spacer>
  );
}

export default FrequentlyAccessedSection;
