import { StoredShareIntent } from '@/types';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage
export const storage = new MMKV({
  id: 'zaveit-storage',
  encryptionKey: 'zaveit-encryption-key'
});

// Keys for different storage items
const STORAGE_KEYS = {
  SHARE_INTENTS: 'share_intents',
  SETTINGS: 'settings',
} as const;

// Share Intents
export const getShareIntents = (): StoredShareIntent[] => {
  const intents = storage.getString(STORAGE_KEYS.SHARE_INTENTS);
  return intents ? JSON.parse(intents) : [];
};

export const addShareIntent = (intent: Omit<StoredShareIntent, 'timestamp'>) => {
  const intents = getShareIntents();
  const newIntent: StoredShareIntent = {
    ...intent,
    timestamp: Date.now(),
  };
  
  storage.set(STORAGE_KEYS.SHARE_INTENTS, JSON.stringify([newIntent, ...intents]));
  return newIntent;
};

export const removeShareIntent = (timestamp: number) => {
  const intents = getShareIntents();
  const filteredIntents = intents.filter(intent => intent.timestamp !== timestamp);
  storage.set(STORAGE_KEYS.SHARE_INTENTS, JSON.stringify(filteredIntents));
};

export const clearShareIntents = () => {
  storage.delete(STORAGE_KEYS.SHARE_INTENTS);
};

// Settings
interface Settings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  notifications: true,
};

export const getSettings = (): Settings => {
  const settings = storage.getString(STORAGE_KEYS.SETTINGS);
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
};

export const updateSettings = (newSettings: Partial<Settings>) => {
  const currentSettings = getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  return updatedSettings;
};

// Utility functions
export const clearAll = () => {
  storage.clearAll();
};

export const getAllKeys = () => {
  return storage.getAllKeys();
}; 