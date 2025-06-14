import { Units } from "@/common/constants/units";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
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
    <Spacer gap="s16">
      <Spacer style={styles.titleContainer} direction="horizontal" size="s16">
        <Text style={GeneralStyles.textTitleSection}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity hitSlop={Units.s16} onPress={onViewAll}>
            <Text style={GeneralStyles.textLink}>View All</Text>
          </TouchableOpacity>
        )}
      </Spacer>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        <Spacer
          style={GeneralStyles.directionRow}
          direction="horizontal"
          size="s16"
          gap="s16"
        >
          {posts.map((post) => (
            <Element
              {...post}
              key={post.id}
              onPress={() => onPostPress(post.id)}
            />
          ))}
        </Spacer>
      </ScrollView>
    </Spacer>
  );
}

export default HorizontalScrollViewPosts;
