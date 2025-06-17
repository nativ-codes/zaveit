import {
  HorizontalScrollviewTags,
  PreviewPost,
  TopBar,
} from "@/common/components";
import { Colors } from "@/common/constants/colors";
import { Spacer, TabLayout } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { usePosts } from "@/config/storage/persistent";
import { StoredPost } from "@/types";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
    () => getSecondaryTags({ tags: sortedTags, selectedPrimaryTag }),
    [sortedTags, selectedPrimaryTag]
  );

  const renderFilteredPost = (post: StoredPost) => (
    <PreviewPost
      key={post.id}
      {...post}
      onPress={() => {
        router.push({
          pathname: "/post-details/[id]",
          params: { id: post.id },
        });
      }}
    />
  );

  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
      <TopBar left={<Text style={GeneralStyles.textTitleScreen}>Search</Text>} />
      </Spacer>
      <Spacer direction="bottom" gap="s16" size="s32">
        <Spacer direction="horizontal" size="s16">
          <TextInput
            style={styles.searchInput}
            placeholder="Search your saved content..."
            value={searchQuery}
            placeholderTextColor={Colors.text.placeholder}
            onChangeText={setSearchQuery}
          />
        </Spacer>

        <HorizontalScrollviewTags
          primaryTags={primaryTags}
          secondaryTags={secondaryTags}
          onPrimaryTagSelect={setSelectedPrimaryTag}
          onSecondaryTagSelect={setSelectedSecondaryTags}
          selectedPrimaryTag={selectedPrimaryTag}
          selectedSecondaryTags={selectedSecondaryTags}
        />
      </Spacer>

      {selectedTags.length > 0 || searchQuery.trim() ? (
        <Spacer direction="horizontal" size="s16" gap="s16">
          {filteredPosts.map(renderFilteredPost)}
        </Spacer>
      ) : sortedTags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No tags found. Start adding content to see tags.
          </Text>
        </View>
      ) : (
        <Spacer gap="s24">
          <TagPostsList tags={sortedMainTags} posts={posts} />
        </Spacer>
      )}
    </TabLayout>
  );
}

export default SearchScreen;
