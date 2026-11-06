import { ApiEndpoints } from "@/config/api";
import { getAppCheckToken } from "@/config/app-check";
import { getAuth, getIdToken } from "@react-native-firebase/auth";
import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { v4 as uuid } from "uuid";

const THUMBNAIL_WIDTH = 600;
// Must stay below 1, which makes a lossless WebP far over the server's 200 KB cap.
const THUMBNAIL_COMPRESS = 0.75;

// Downloads the source picture and saves a 600 px wide WebP; decoding rejects error pages.
export const makeThumbnail = async (sourceUrl: string): Promise<string> => {
  const downloadUri = `${FileSystem.cacheDirectory}${uuid()}`;

  try {
    const { status } = await FileSystem.downloadAsync(sourceUrl, downloadUri);
    if (status < 200 || status >= 300) {
      throw new Error(`Thumbnail source answered ${status}`);
    }

    const image = await ImageManipulator.manipulate(downloadUri)
      .resize({ width: THUMBNAIL_WIDTH })
      .renderAsync();
    const { uri } = await image.saveAsync({
      format: SaveFormat.WEBP,
      compress: THUMBNAIL_COMPRESS,
    });

    return uri;
  } finally {
    await FileSystem.deleteAsync(downloadUri, { idempotent: true });
  }
};

// Sends the WebP to the Go server, which stores it in R2 and answers with its public URL.
export const uploadThumbnail = async (fileUri: string): Promise<string> => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("Uploading a Thumbnail needs a signed-in user");
    }

    const response = await FileSystem.uploadAsync(ApiEndpoints.thumbnails, fileUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        "Content-Type": "image/webp",
        Authorization: `Bearer ${await getIdToken(user)}`,
        "X-Firebase-AppCheck": await getAppCheckToken(),
      },
    });

    if (response.status !== 201) {
      throw new Error(`Thumbnail upload answered ${response.status}`);
    }

    const { url } = JSON.parse(response.body);
    if (typeof url !== "string" || !url) {
      throw new Error("Thumbnail upload answered without a URL");
    }

    return url;
  } finally {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
};
