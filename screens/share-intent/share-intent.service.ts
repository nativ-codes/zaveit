import { safelyPrintError } from "@/common/utils/error-parsers";
import { ErrorHandler } from "@/config/errors";
import {
  fetchLinkPreview,
  fetchLocalLinkPreview,
  fetchOEmbedMetadata,
} from "@/services/general.service";
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

type GetLinkPreviewMetadataReturnType = {
  title: string;
  image: string;
  url: string;
};

type GetLinkPreviewMetadataType = {
  url: string;
};

export const getOEmbedMetadata = async ({
  platformConfig,
  url,
}: GetOEmbedMetadataType): Promise<GetOEmbedMetadataReturnType | undefined> => {
  try {
    const response = await fetchOEmbedMetadata({
      url,
      platformConfig,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch oEmbed metadata");
    }

    const data = await response.json();

    return {
      author: data.author_name,
      title: data.title,
      thumbnail: data.thumbnail_url,
      url: url || "",
    };
  } catch (error) {
    ErrorHandler.logError({
      location: "getOEmbedMetadata",
      error: safelyPrintError(error),
      metadata: {
        url,
      },
    });
    return undefined;
  }
};

export const getLinkPreviewMetadata = async ({
  url,
}: GetLinkPreviewMetadataType): Promise<
  GetLinkPreviewMetadataReturnType | undefined
> => {
  try {
    const response = await fetchLinkPreview(url);

    if (!response.ok) {
      throw new Error("Failed to fetch link preview metadata");
    }

    const data = await response.json();

    return {
      title: data.title || "",
      image: data.image || "",
      url: url || "",
    };
  } catch (error) {
    ErrorHandler.logError({
      location: "getLinkPreviewMetadata",
      error: safelyPrintError(error),
      metadata: {
        url,
      },
    });
    return undefined;
  }
};

type GetLocalLinkPreviewMetadataReturnType = {
  title: string;
  thumbnail: string;
};

type GetLocalLinkPreviewMetadataType = {
  url: string;
};

export const getLocalLinkPreviewMetadata = async ({
  url,
}: GetLocalLinkPreviewMetadataType): Promise<
  GetLocalLinkPreviewMetadataReturnType | undefined
> => {
  try {
    const response = await fetchLocalLinkPreview(url);

    if (!response.ok) {
      throw new Error("Failed to fetch local link preview metadata");
    }

    const data = await response.json();

    return {
      title: data.title || "",
      thumbnail: data.thumbnail || data.image || "",
    };
  } catch (error) {
    ErrorHandler.logError({
      location: "getLocalLinkPreviewMetadata",
      error: safelyPrintError(error),
      metadata: {
        url,
      },
    });
    return undefined;
  }
};
