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
  thumbnail?: string;
  embedProductId?: string;
  url: string;
};

type TikTokEmbedMetadataReturnType = {
  author: string;
  title: string;
  thumbnail?: string;
};

type TikTokVideoDataType = {
  itemInfos?: {
    text?: string;
    covers?: string[];
    coversOrigin?: string[];
  };
  authorInfos?: {
    nickName?: string;
    uniqueId?: string;
  };
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
      author: data.author_name || "",
      title: data.title || "",
      thumbnail: data.thumbnail_url,
      embedProductId: data.embed_product_id,
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

const TIKTOK_EMBED_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const findTikTokVideoData = (
  value: unknown
): TikTokVideoDataType | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const videoData = value.videoData;
  if (isRecord(videoData) && isRecord(videoData.itemInfos)) {
    return videoData as TikTokVideoDataType;
  }

  for (const nested of Object.values(value)) {
    const found = findTikTokVideoData(nested);
    if (found) {
      return found;
    }
  }

  return undefined;
};

const parseTikTokEmbedHtml = (
  html: string
): TikTokEmbedMetadataReturnType | undefined => {
  const match = html.match(
    /<script[^>]*FRONTITY_CONNECT_STATE[^>]*>(\{[\s\S]*?\})<\/script>/
  );

  if (!match?.[1]) {
    return undefined;
  }

  try {
    const videoData = findTikTokVideoData(JSON.parse(match[1]));
    const title = videoData?.itemInfos?.text?.trim() || "";
    const author =
      videoData?.authorInfos?.nickName?.trim() ||
      videoData?.authorInfos?.uniqueId?.trim() ||
      "";
    const thumbnail =
      videoData?.itemInfos?.covers?.[0] ||
      videoData?.itemInfos?.coversOrigin?.[0];

    if (!title && !thumbnail) {
      return undefined;
    }

    return { title, author, thumbnail };
  } catch {
    return undefined;
  }
};

export const getTikTokEmbedMetadata = async (
  videoId: string
): Promise<TikTokEmbedMetadataReturnType | undefined> => {
  if (!videoId) {
    return undefined;
  }

  try {
    const response = await fetch(
      `https://www.tiktok.com/embed/v2/${videoId}`,
      {
        headers: {
          Accept: "text/html",
          "User-Agent": TIKTOK_EMBED_USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch TikTok embed metadata");
    }

    const html = await response.text();
    return parseTikTokEmbedHtml(html);
  } catch (error) {
    ErrorHandler.logError({
      location: "getTikTokEmbedMetadata",
      error: safelyPrintError(error),
      metadata: {
        videoId,
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
