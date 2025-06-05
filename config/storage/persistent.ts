import { generateTags, getContentForTagGeneration } from '@/services/llm';
import { StoredShareIntent } from '@/types/share-intents';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'zaveit-storage',
  encryptionKey: 'zaveit-encryption-key'
});

export function getShareIntents(): StoredShareIntent[] {
  const intents = storage.getString('share_intents');
  return intents ? JSON.parse(intents) : [];
}

export async function saveShareIntent(intent: Omit<StoredShareIntent, 'tags'>): Promise<void> {
  const intents = getShareIntents();
  
  // Generate tags for the content
  const content = getContentForTagGeneration(
    intent.url,
    intent.title,
  );
  
  const tags = await generateTags(content);
  
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