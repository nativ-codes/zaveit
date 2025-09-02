import { getSortedTags } from "@/screens/search/search.util";
import { getPosts } from "./posts";

export const getTags = (): string[] => {
  const posts = getPosts();
  return getSortedTags(posts);
};
