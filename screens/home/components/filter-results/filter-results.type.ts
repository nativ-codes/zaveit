import { StoredShareIntent } from "@/types";

export type FilterResultsType = {
  searchQuery: string;
  selectedTags: string[];
  shareIntents: StoredShareIntent[];
  onPostPress: (timestamp: number) => void;
}; 