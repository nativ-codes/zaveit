import { Colors, Units } from "@/common/constants";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import PostImage from "@/common/containers/post-image/post-image";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { Haptics } from "@/common/utils/haptics";
import { useRandomPickPost } from "@/config/storage";
import Icon from "@expo/vector-icons/Feather";
import React, { useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "./random-pick-section.style";
import { RandomPickSectionPropsType } from "./random-pick-section.type";

function RandomPickSection({ onPostPress }: RandomPickSectionPropsType) {
  const { post, shuffle } = useRandomPickPost();
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  if (!post) {
    return null;
  }

  const domain = getDomainFromUrl(post.url);

  const handleShuffle = () => {
    Haptics.light();
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(fade, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      shuffle();
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={StyleSheet.compose(styles.container, GeneralStyles.shadow)}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
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
      </Animated.View>

      <TouchableOpacity
        style={styles.shuffleButton}
        onPress={handleShuffle}
        activeOpacity={ACTIVE_OPACITY}
        hitSlop={Units.s8}
        accessibilityRole="button"
        accessibilityLabel="Show another random post"
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="refresh-cw" size={22} color={Colors.white} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

export default RandomPickSection;
