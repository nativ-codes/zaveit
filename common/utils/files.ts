import * as FileSystem from "expo-file-system";

export const saveImageFromUrl = async (url: string, id: string) => {
  const localUri = `${FileSystem.documentDirectory}${id}.jpg`;

  try {
    // Ensure the directory exists before downloading
    const directoryInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory as string);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory as string, { intermediates: true });
    }

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

export const deleteAllImages = async () => {
  try {
    await FileSystem.deleteAsync(FileSystem.documentDirectory as string, {
      idempotent: true,
    });
  } catch (e) {
    console.error("Error deleting all files:", e);
  }
};