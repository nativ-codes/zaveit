import { Units } from "@/common/constants/units";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "./horizontal-scrollview-posts.style";
import { HorizontalScrollViewPostsType } from "./horizontal-scrollview-posts.type";

function HorizontalScrollViewPosts({
  title,
  posts,
  Element,
  onViewAll,
  onPostPress,
}: HorizontalScrollViewPostsType) {
  return (
    <View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity hitSlop={Units.s16} onPress={onViewAll}>
          <Text style={styles.seeAllButtonText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {posts.map((post) => (
          <Element
            {...post}
            key={post.id}
            onPress={() => onPostPress(post.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default HorizontalScrollViewPosts;
