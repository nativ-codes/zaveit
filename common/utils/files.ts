import { ErrorHandler } from "@/config/errors";
import * as FileSystem from "expo-file-system";
import { safelyPrintError } from "./error-parsers";

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
  } catch (error) {
    ErrorHandler.logError({
      location: "saveImageFromUrl",
      error: safelyPrintError(error),
      metadata: {
        url,
      },
    });
    return null;
  }
}

export const deleteImage = async (localUri: string) => {
  try {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (error) {
    ErrorHandler.logError({
      location: "deleteImage",
      error: safelyPrintError(error),
      metadata: {
        localUri,
      },
    });
  }
}

export const deleteAllImages = async () => {
  try {
    await FileSystem.deleteAsync(FileSystem.documentDirectory as string, {
      idempotent: true,
    });
  } catch (error) {
    ErrorHandler.logError({
      location: "deleteAllImages",
      error: safelyPrintError(error),
    });
  }
};