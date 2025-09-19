import { MAIN_TAGS } from "@/common/constants";
import { PostType } from "@/types";

export const getSortedTags = (posts: PostType[]) => {
  const mappedTags = posts.reduce((tags, post) => {
    post.tags?.forEach((tag) => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
    return tags;
  }, {} as Record<string, number>);

  return Object.entries(mappedTags)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([tag]) => tag);
};

export const getSortedMainTags = (tags: string[]) => {
  return tags.filter((tag) =>
    MAIN_TAGS.includes(tag as (typeof MAIN_TAGS)[number])
  );
};

export const getPrimaryTags = (tags: string[]) => {
  return tags.filter((tag) =>
    MAIN_TAGS.includes(tag as (typeof MAIN_TAGS)[number])
  );
};

type GetSecondaryTagsType = {
  tags: string[];
  selectedPrimaryTag: string;
};

export const getSecondaryTags = ({
  tags,
  selectedPrimaryTag,
}: GetSecondaryTagsType) => {
  return tags.filter((tag) => tag !== selectedPrimaryTag);
};

type GetFilteredPostsType = {
  posts: PostType[];
  selectedTags: string[];
  searchQuery: string;
};

export const getFilteredPosts = ({
  posts,
  selectedTags,
  searchQuery,
}: GetFilteredPostsType): PostType[] => {
  const query = searchQuery.toLowerCase().trim();
  const hasQuery = query.length > 0;
  const hasTags = selectedTags.length > 0;

  return posts.filter((post) => {
    // Check search query if it exists
    if (hasQuery) {
      const matchesQuery =
        (post.title?.toLowerCase().includes(query) ?? false) ||
        post.url.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    // Check tags if any are selected
    if (hasTags) {
      return selectedTags.every((tag) => post.tags && post.tags.includes(tag));
    }

    return true;
  });
};

type GetPostsForTagType = {
  posts: PostType[];
  tag: string;
};

export const getPostsForTag = ({ posts, tag }: GetPostsForTagType) => {
  if (!posts || posts.length === 0) return [];

  const filteredPosts = posts.filter(
    (post: PostType) => post.tags && post.tags.includes(tag)
  );

  return [...filteredPosts].reverse();
};

export const getRandomPick = (posts: PostType[]) => {
  if (posts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * posts.length);

  return posts[randomIndex];
};

type GetPostDetailsType = {
  posts: PostType[];
  id: string;
};

export const getPostDetails = ({ posts, id }: GetPostDetailsType) => {
  return posts.find((post) => post.id === id);
};
