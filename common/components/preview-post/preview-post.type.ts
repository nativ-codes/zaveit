import { StoredPost } from '@/types/share-intents';

export type PreviewPostPropsType = Omit<StoredPost, 'metadata' | 'author' | 'timestamp' | 'id' > & {
  onPress?: () => void;
}; 