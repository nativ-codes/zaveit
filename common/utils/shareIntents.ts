import { getShareIntents } from '@/config/storage/persistent';
import { StoredShareIntent } from '@/types/share-intents';

export function getShareIntent(timestamp: number): StoredShareIntent {
  const shareIntents = getShareIntents();
  const shareIntent = shareIntents.find((intent: StoredShareIntent) => intent.timestamp === timestamp);
  
  if (!shareIntent) {
    throw new Error('Share intent not found');
  }

  return shareIntent;
} 