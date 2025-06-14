import { CATEGORIES } from "@/common/constants/categories";
import { StoredPost } from "@/types";

export const getSortedTags = (posts: StoredPost[]) => {
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

export const getPrimaryTags = (tags: string[]) => {
  return tags.filter((tag) => CATEGORIES.includes(tag));
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
  posts: StoredPost[];
  selectedTags: string[];
  searchQuery: string;
};

export const getFilteredPosts = ({
  posts,
  selectedTags,
  searchQuery,
}: GetFilteredPostsType): StoredPost[] => {
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
  posts: StoredPost[];
  tag: string;
};

export const getPostsForTag = ({ posts, tag }: GetPostsForTagType) => {
  if (!posts || posts.length === 0) return [];

  return posts.filter(
    (post: StoredPost) => post.tags && post.tags.includes(tag)
  );
};

export const getRandomPick = (posts: StoredPost[]) => {
  if (posts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * posts.length);

  return posts[randomIndex];
};
