import { safelyPrintError } from "@/common/utils";
import { PlatformConfig } from "@/types";

type GetOEmbedMetadataReturnType = {
  author: string;
  title: string;
  thumbnail: string;
  url: string;
};

type GetOEmbedMetadataType = {
  platformConfig: PlatformConfig;
  url: string;
};

export const getOEmbedMetadata = async ({
  platformConfig,
  url,
}: GetOEmbedMetadataType): Promise<GetOEmbedMetadataReturnType> => {
  try {
    const encodedUrl = encodeURIComponent(url || "");
    const response = await fetch(
      `${platformConfig.oembedEndpoint}?url=${encodedUrl}&format=json`
    );


    if (!response.ok) {
      throw new Error("Failed to fetch oEmbed metadata");
    }

    const data = await response.json();

    console.log("data", JSON.stringify(data));

    return {
      author: data.author_name,
      title: data.title,
      thumbnail: data.thumbnail_url,
      url: url || "",
    };
  } catch (error) {
    console.log("getOEmbedMetadata", safelyPrintError(error));
    throw error;
  }
};
