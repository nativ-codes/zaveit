import { StoredShareIntent } from '@/types/share-intents';

export type PreviewPostPropsType = Omit<StoredShareIntent, 'metadata' | 'author' | 'timestamp'> & {
  onPress: () => void;
}; 