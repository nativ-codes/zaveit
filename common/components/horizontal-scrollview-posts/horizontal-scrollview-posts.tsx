import { ACTIVE_OPACITY } from "@/common/constants/ui";
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
    <Spacer gap="s8">
      <Spacer style={styles.titleContainer} direction="horizontal" size="s16">
        <Text style={GeneralStyles.textTitleSectionPrimary}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity
            activeOpacity={ACTIVE_OPACITY}
            hitSlop={Units.s16}
            onPress={onViewAll}
          >
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
          direction={["horizontal", "vertical"]}
          size={["s16", "s8"]}
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
