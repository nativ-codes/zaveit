import * as FileSystem from "expo-file-system";

export const saveImageFromUrl = async (url: string, id: string) => {
  const localUri = `${FileSystem.documentDirectory}${id}.jpg`;

  try {
    await FileSystem.downloadAsync(url, localUri);

    return localUri;
  } catch (e) {
    console.error("Image download failed", e);
    return null;
  }
}

export const deleteImage = async (localUri: string) => {
  try {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (e) {
    console.error("Error deleting file:", e);
  }
}