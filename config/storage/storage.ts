import { MMKV } from "react-native-mmkv";

let storageInstance: MMKV | null = null;

export const getStorage = (): MMKV => {
  if (!storageInstance) {
    storageInstance = new MMKV({
      id: "zaveit-storage-v1",
      encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTON_KEY,
    });
  }
  
  return storageInstance;
};

// Export the instance for backward compatibility
export const storage = getStorage();