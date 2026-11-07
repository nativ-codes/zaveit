import {
  EmptyPlaceholder,
  HorizontalScrollViewTags,
  PreviewPost,
  SearchInput,
  TopBar,
} from "@/common/components";
import { Colors, TAB_BAR_HEIGHT, Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { usePosts } from "@/config/storage";
import { PostType } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TagMosaic from "./components/tag-mosaic/tag-mosaic";
import styles from "./search.style";
import {
  getFilteredPosts,
  getPrimaryTags,
  getSecondaryTags,
  getSortedMainTags,
  getSortedTags,
} from "./search.util";

type FilteredPostItemType = { type: "filtered-post"; post: PostType };
type EmptyItemType = { type: "empty"; message: string; instruction: string };
type TagMosaicItemType = { type: "tag-mosaic" };
type SearchListItemType =
  | TagMosaicItemType
  | FilteredPostItemType
  | EmptyItemType;

function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const posts = usePosts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrimaryTag, setSelectedPrimaryTag] = useState<
    string | undefined
  >();
  const [selectedSecondaryTags, setSelectedSecondaryTags] = useState<string[]>(
    []
  );

  const selectedTags = useMemo(
    () =>
      [selectedPrimaryTag, ...selectedSecondaryTags].filter(
        Boolean
      ) as string[],
    [selectedPrimaryTag, selectedSecondaryTags]
  );

  const filteredPosts = useMemo(
    () => getFilteredPosts({ posts, selectedTags, searchQuery }),
    [posts, selectedTags, searchQuery]
  );

  const sortedTags = useMemo(
    () => getSortedTags(filteredPosts || []),
    [filteredPosts]
  );

  const sortedMainTags = useMemo(
    () => getSortedMainTags(sortedTags),
    [sortedTags]
  );

  const primaryTags = useMemo(() => getPrimaryTags(sortedTags), [sortedTags]);

  const secondaryTags = useMemo(
    () =>
      getSecondaryTags({
        tags: sortedTags,
        selectedPrimaryTag: selectedPrimaryTag || "",
      }),
    [sortedTags, selectedPrimaryTag]
  );

  const listData = useMemo((): SearchListItemType[] => {
    if (selectedTags.length > 0 || searchQuery.trim()) {
      if (filteredPosts.length === 0) {
        return [
          {
            type: "empty",
            message: "No posts found.",
            instruction: "Try adding more content.",
          },
        ];
      }
      return filteredPosts.map((post) => ({ type: "filtered-post", post }));
    }
    if (sortedTags.length === 0) {
      return [
        {
          type: "empty",
          message: "No tags found.",
          instruction: "Start adding content to see tags.",
        },
      ];
    }
    return [{ type: "tag-mosaic" }];
  }, [selectedTags, searchQuery, filteredPosts, sortedTags]);

  const handleOnClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Stable, so memoized post cards don't re-render on every Tag tap.
  const handleOnPostPress = useCallback(
    (id: string) => router.push({ pathname: "/post-details", params: { id } }),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchListItemType }) => {
      if (item.type === "empty") {
        return (
          <EmptyPlaceholder message={item.message} instruction={item.instruction} />
        );
      }
      if (item.type === "tag-mosaic") {
        return <TagMosaic tags={sortedMainTags} posts={posts} onTagPress={setSelectedPrimaryTag} />;
      }
      return (
        <View style={styles.filteredPostContainer}>
          <PreviewPost {...item.post} onPress={handleOnPostPress} />
        </View>
      );
    },
    [posts, handleOnPostPress, sortedMainTags]
  );

  const renderItemSeparator = useCallback(
    ({ leadingItem }: { leadingItem: SearchListItemType }) => {
      if (leadingItem.type === "filtered-post") {
        return <View style={styles.itemSeparator} />;
      }
      return null;
    },
    []
  );

  const getItemType = useCallback(
    (item: SearchListItemType) => item.type,
    []
  );

  const keyExtractor = useCallback(
    (item: SearchListItemType, index: number) => {
      if (item.type === "filtered-post") return item.post.id;
      if (item.type === "tag-mosaic") return "tag-mosaic";
      return `empty-${index}`;
    },
    []
  );

  const listHeader = useMemo(
    () => (
      <View>
        <Spacer direction="bottom" size="s8">
          <TopBar
            left={
              <Text style={GeneralStyles.textTitleScreenPrimary}>Search</Text>
            }
          />
        </Spacer>
        <Spacer direction="bottom" gap="s16" size="s32">
          <Spacer direction="horizontal" size="s16">
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              isActionVisible={Boolean(searchQuery.length)}
              onAction={handleOnClearSearch}
            />
          </Spacer>
          <HorizontalScrollViewTags
            primaryTags={primaryTags}
            secondaryTags={secondaryTags}
            onPrimaryTagSelect={setSelectedPrimaryTag}
            onSecondaryTagSelect={setSelectedSecondaryTags}
            selectedPrimaryTag={selectedPrimaryTag}
            selectedSecondaryTags={selectedSecondaryTags}
          />
        </Spacer>
      </View>
    ),
    [
      searchQuery,
      primaryTags,
      secondaryTags,
      selectedPrimaryTag,
      selectedSecondaryTags,
      handleOnClearSearch,
    ]
  );

  return (
    <View style={StyleSheet.compose(GeneralStyles.flex, {
      backgroundColor: Colors.background.primary,
    })}>
      <FlashList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={renderItemSeparator}
        keyboardShouldPersistTaps="handled"
        // A Tag change replaces the list; anchoring to the old first Post scrolls the page by itself.
        maintainVisibleContentPosition={{ disabled: true }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Units.s16,
        }}
      />
    </View>
  );
}

export default SearchScreen;
