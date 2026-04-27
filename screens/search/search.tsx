import {
  EmptyPlaceholder,
  HorizontalScrollViewTags,
  PreviewPost,
  PreviewPostTile,
  SearchInput,
  TopBar,
} from "@/common/components";
import HorizontalScrollViewPosts from "@/common/components/horizontal-scrollview-posts/horizontal-scrollview-posts";
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
import styles from "./search.style";
import {
  getFilteredPosts,
  getPostsForTag,
  getPrimaryTags,
  getSecondaryTags,
  getSortedMainTags,
  getSortedTags,
} from "./search.util";

type TagSectionItemType = { type: "tag-section"; tag: string };
type FilteredPostItemType = { type: "filtered-post"; post: PostType };
type EmptyItemType = { type: "empty"; message: string; instruction: string };
type SearchListItemType =
  | TagSectionItemType
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
    return sortedMainTags.map((tag) => ({ type: "tag-section", tag }));
  }, [selectedTags, searchQuery, filteredPosts, sortedTags, sortedMainTags]);

  const handleOnClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SearchListItemType }) => {
      if (item.type === "empty") {
        return (
          <EmptyPlaceholder message={item.message} instruction={item.instruction} />
        );
      }
      if (item.type === "tag-section") {
        const tagPosts = getPostsForTag({ posts, tag: item.tag });
        if (tagPosts.length === 0) return null;
        return (
          <HorizontalScrollViewPosts
            title={`#${item.tag.toLowerCase()}`}
            posts={tagPosts}
            Element={PreviewPostTile}
            onViewAll={() =>
              router.push({ pathname: "/view-posts", params: { tag: item.tag } })
            }
            onPostPress={(id: string) =>
              router.push({ pathname: "/post-details", params: { id } })
            }
            estimatedItemSize={Units.s256}
          />
        );
      }
      return (
        <View style={styles.filteredPostContainer}>
          <PreviewPost
            {...item.post}
            onPress={() =>
              router.push({ pathname: "/post-details", params: { id: item.post.id } })
            }
          />
        </View>
      );
    },
    [posts, router]
  );

  const renderItemSeparator = useCallback(
    ({ leadingItem }: { leadingItem: SearchListItemType }) => {
      if (leadingItem.type === "tag-section") {
        return <View style={styles.tagSectionSeparator} />;
      }
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
      if (item.type === "tag-section") return `tag-${item.tag}`;
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
        estimatedItemSize={Units.s256}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={renderItemSeparator}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Units.s16,
        }}
      />
    </View>
  );
}

export default SearchScreen;
