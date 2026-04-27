import { EmptyPlaceholder, TopBar } from "@/common/components";
import SwipePreviewPost from "@/common/components/swipe-preview-post/swipe-preview-post";
import { Colors, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { idExtractor } from "@/common/utils";
import { removePost, usePosts } from "@/config/storage";
import { PostType } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPostsForTag } from "../search/search.util";
import { ViewPostsPropsType } from "./view-posts.type";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  listHeader: {
    marginBottom: Units.s8,
  },
  tagRow: {
    paddingLeft: Units.s16,
    paddingBottom: Units.s16,
  },
  rowInset: {
    paddingHorizontal: Units.s16,
  },
  itemSeparator: {
    height: Units.s16,
  },
});

function ViewPostsScreen() {
  const { tag } = useLocalSearchParams<ViewPostsPropsType>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const posts = usePosts();

  const filteredPosts = useMemo(
    () => getPostsForTag({ posts, tag }),
    [posts, tag]
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.listHeader} accessibilityLabel="View posts header">
          <TopBar hasBackButton />
        </View>
        <View style={styles.tagRow} accessibilityLabel="Active tag">
          <Text
            style={GeneralStyles.textTitleScreenPrimary}
            accessibilityRole="header"
          >{`#${tag}`}</Text>
        </View>
      </View>
    ),
    [tag]
  );

  const renderItem = useCallback(
    ({ item }: { item: PostType }) => (
      <View style={styles.rowInset}>
        <SwipePreviewPost
          post={item}
          onRemove={() => removePost(item)}
          onPress={() =>
            router.push({
              pathname: "/post-details",
              params: { id: item.id },
            })
          }
        />
      </View>
    ),
    [router]
  );

  const renderItemSeparator = useCallback(
    () => <View style={styles.itemSeparator} />,
    []
  );

  const renderListEmpty = useCallback(
    () => (
      <View style={styles.rowInset} accessibilityLabel="No posts for tag">
        <EmptyPlaceholder
          message="No posts found"
          instruction="Try adding more posts"
        />
      </View>
    ),
    []
  );

  return (
    <View style={StyleSheet.compose(GeneralStyles.flex, styles.root)}>
      <FlashList
        data={filteredPosts}
        keyExtractor={idExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderListEmpty}
        ItemSeparatorComponent={renderItemSeparator}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + Units.s16,
        }}
        extraData={tag}
      />
    </View>
  );
}

export default ViewPostsScreen;
