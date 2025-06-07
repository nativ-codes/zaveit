import { StoredShareIntent } from "@/types";

export type MostRecentSectionPropsType = {
  posts: StoredShareIntent[];
  onPostPress: (timestamp: number) => void;
  onViewAll: () => void;
}; 