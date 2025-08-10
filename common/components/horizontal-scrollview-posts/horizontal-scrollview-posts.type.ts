import { PostType } from "@/types";

export type HorizontalScrollViewPostsType = {
  title: string;
  posts: PostType[];
  Element: React.ComponentType<any>;
  onViewAll?: () => void;
  onPostPress: (id: string) => void;
  estimatedItemSize?: number;
  shouldDisplayCount?: boolean;
};