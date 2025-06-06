import { MAX_CONTENT_LENGTH } from '@/common/constants';
import { generateTags } from '@/services/llm';
import { StoredShareIntent } from '@/types/share-intents';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: "zaveit-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTON_KEY,
});

export function getShareIntents(): StoredShareIntent[] {
  const intents = storage.getString('share_intents');
  return intents ? JSON.parse(intents) : [];
}

export async function saveShareIntent(intent: Omit<StoredShareIntent, 'tags'>): Promise<void> {
  const intents = getShareIntents();
  
  // Generate tags for the content
  const content = intent.title?.substring(0, MAX_CONTENT_LENGTH) || "";
  
  const tags = await generateTags(content);
  console.log(">> tags", JSON.stringify(tags));
  
  const newIntent: StoredShareIntent = {
    ...intent,
    tags,
  };

  intents.unshift(newIntent);
  storage.set('share_intents', JSON.stringify(intents));
}

export function removeShareIntent(timestamp: number): void {
  const intents = getShareIntents();
  const updatedIntents = intents.filter(intent => intent.timestamp !== timestamp);
  storage.set('share_intents', JSON.stringify(updatedIntents));
} 