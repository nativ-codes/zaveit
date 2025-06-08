import { StoredShareIntent } from "@/types";

export type HorizontalScrollViewPostsType = {
  title: string;
  posts: StoredShareIntent[];
  onViewAll: () => void;
  Element: React.ComponentType<any>;
  onPostPress: (id: string) => void;
}; 