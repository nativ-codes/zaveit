import { StoredShareIntent } from '@/types/share-intents';

export type ShareIntentRowType = {
  data: StoredShareIntent;
  onDelete?: (timestamp: number) => void;
  showDeleteButton?: boolean;
}; 