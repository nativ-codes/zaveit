import {
  Button,
  EmptyPlaceholder,
  HorizontalScrollViewTags,
  PreviewPost,
  TopBar,
} from "@/common/components";
import { Units } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { idExtractor } from "@/common/utils";
import { usePosts } from "@/config/storage/persistent";
import { PostType } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import TagPostsList from "./components/tag-posts-list/tag-posts-list";
import styles from "./search.style";
import {
  getFilteredPosts,
  getPrimaryTags,
  getSecondaryTags,
  getSortedMainTags,
  getSortedTags,
} from "./search.util";

function SearchScreen() {
  const router = useRouter();

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

  const renderItemSeparator = useCallback(
    () => <View style={styles.itemSeparator} />,
    []
  );

  const renderFilteredPost = ({ item }: { item: PostType }) => (
    <PreviewPost
      key={item.id}
      {...item}
      onPress={() => {
        router.push({
          pathname: "/post-details/[id]",
          params: { id: item.id },
        });
      }}
    />
  );

  const handleOnClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={
            <Text style={GeneralStyles.textTitleScreenPrimary}>Search</Text>
          }
        />
      </Spacer>
      <Spacer direction="bottom" gap="s16" size="s32">
        <Spacer direction="horizontal" size="s16">
          <View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your saved content..."
              value={searchQuery}
              placeholderTextColor={Colors.text.placeholder}
              onChangeText={setSearchQuery}
            />
            {Boolean(searchQuery.length) && (
              <View style={styles.clearSearchButton}>
                <Button.Icon iconName="x" onPress={handleOnClearSearch} />
              </View>
            )}
          </View>
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

      {selectedTags.length > 0 || searchQuery.trim() ? (
        <FlashList
          data={filteredPosts}
          keyExtractor={idExtractor}
          estimatedItemSize={Units.s256}
          contentContainerStyle={styles.contentContainer}
          ItemSeparatorComponent={renderItemSeparator}
          renderItem={renderFilteredPost}
        />
      ) : sortedTags.length === 0 ? (
        <EmptyPlaceholder
          message="No tags found."
          instruction="Start adding content to see tags."
        />
      ) : (
        <Spacer gap="s24">
          <TagPostsList tags={sortedMainTags} posts={posts} />
        </Spacer>
      )}
    </ScreenLayout>
  );
}

export default SearchScreen;
