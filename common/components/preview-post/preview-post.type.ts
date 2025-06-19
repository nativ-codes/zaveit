import { PostType } from '@/types/posts';

export type PreviewPostPropsType = Omit<PostType, 'author' | 'timestamp' | 'id' > & {
  onPress?: () => void;
}; 