import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "./horizontal-scrollview-posts.style";
import { HorizontalScrollViewPostsType } from "./horizontal-scrollview-posts.type";

function HorizontalScrollViewPosts({
  title,
  posts,
  Element,
  estimatedItemSize,
  onViewAll,
  onPostPress,
}: HorizontalScrollViewPostsType) {
  const renderItem = ({ item }: { item: any }) => (
    <Element {...item} onPress={() => onPostPress(item.id)} />
  );

  const renderItemSeparator = useCallback(
    () => <View style={styles.itemSeparator} />,
    []
  );

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
      <FlashList
        data={posts}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        contentContainerStyle={styles.contentContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={renderItemSeparator}
      />
    </Spacer>
  );
}

export default HorizontalScrollViewPosts;
