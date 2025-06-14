import { StoredPost } from "@/types";

export type HorizontalScrollViewPostsType = {
  title: string;
  posts: StoredPost[];
  Element: React.ComponentType<any>;
  onViewAll?: () => void;
  onPostPress: (id: string) => void;
}; 