import { StoredPost } from "@/types";

export interface FilterResultsProps {
  posts: StoredPost[];
}

export type FilterResultsType = {
  searchQuery: string;
  selectedTags: string[];
  shareIntents: StoredPost[];
  onPostPress: (timestamp: number) => void;
}; 