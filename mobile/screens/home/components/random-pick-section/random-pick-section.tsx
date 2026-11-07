import { Colors } from "@/common/constants";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { useRandomPickPost } from "@/config/storage";
import Icon from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import styles from "./random-pick-section.style";
import { RandomPickSectionPropsType } from "./random-pick-section.type";

function RandomPickSection({ onPostPress }: RandomPickSectionPropsType) {
  const post = useRandomPickPost();

  if (!post) {
    return null;
  }

  const domain = getDomainFromUrl(post.url);

  return (
    <TouchableOpacity
      style={StyleSheet.compose(styles.container, GeneralStyles.shadow)}
      onPress={() => onPostPress(post.id)}
      activeOpacity={ACTIVE_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={`Rediscover: ${post.title || domain}`}
    >
      <PostImage thumbnailUrl={post.thumbnailUrl} style={styles.image} />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Icon name="shuffle" size={12} color={Colors.white} />
          <Text style={styles.badgeText}>REDISCOVER</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {post.title || domain}
        </Text>
        <Text style={styles.domain} numberOfLines={1}>
          {domain}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default RandomPickSection;
