import { StoredPost } from '@/types/posts';

export type PreviewPostPropsType = Omit<StoredPost, 'metadata' | 'author' | 'timestamp' | 'id' > & {
  onPress?: () => void;
}; 