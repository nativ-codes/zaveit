import { PostType } from "@/types";

export interface FilterResultsProps {
  posts: PostType[];
}

export type FilterResultsType = {
  searchQuery: string;
  selectedTags: string[];
  shareIntents: PostType[];
  onPostPress: (timestamp: number) => void;
}; 