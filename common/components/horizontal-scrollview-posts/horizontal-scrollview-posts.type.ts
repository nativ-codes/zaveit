import { StoredPost } from "@/types";

export interface HorizontalScrollviewPostsProps {
  posts: StoredPost[];
  title: string;
  onPostPress: (timestamp: number) => void;
}

export type HorizontalScrollViewPostsType = {
  title: string;
  posts: StoredPost[];
  onViewAll: () => void;
  Element: React.ComponentType<any>;
  onPostPress: (timestamp: number) => void;
}; 