import { safelyPrintError } from "@/common/utils/error-parsers";
import { ErrorHandler } from "@/config/errors";
import {
  fetchLinkPreview,
  fetchLocalLinkPreview,
  fetchOEmbedMetadata,
  fetchTikTokEmbedPage,
} from "@/services/general.service";
import { PlatformConfig } from "@/types";

type GetOEmbedMetadataReturnType = {
  author: string;
  title: string;
  thumbnail?: string;
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

    if (!data.title) {
      return undefined;
    }

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

type GetTikTokEmbedMetadataType = {
  url: string;
};

type TikTokEmbedItemInfosType = {
  text?: string;
  covers?: string[];
};

type TikTokEmbedAuthorInfosType = {
  nickName?: string;
  uniqueId?: string;
};

type TikTokEmbedVideoDataType = {
  itemInfos?: TikTokEmbedItemInfosType;
  authorInfos?: TikTokEmbedAuthorInfosType;
};

const getTikTokVideoId = (url: string): string | undefined => {
  const match = url.match(/\/(?:video|photo)\/(\d+)/);
  return match?.[1];
};

const parseFrontityConnectState = (html: string): unknown => {
  const match = html.match(
    /<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!match?.[1]) {
    return undefined;
  }

  return JSON.parse(match[1]);
};

const findTikTokVideoData = (
  state: unknown
): TikTokEmbedVideoDataType | undefined => {
  if (!state || typeof state !== "object") {
    return undefined;
  }

  const source = (state as { source?: { data?: Record<string, unknown> } })
    .source;
  const pages = source?.data;

  if (!pages) {
    return undefined;
  }

  for (const page of Object.values(pages)) {
    if (!page || typeof page !== "object") {
      continue;
    }

    const videoData = (page as { videoData?: TikTokEmbedVideoDataType })
      .videoData;

    if (videoData?.itemInfos) {
      return videoData;
    }
  }

  return undefined;
};

export const getTikTokEmbedMetadata = async ({
  url,
}: GetTikTokEmbedMetadataType): Promise<
  GetOEmbedMetadataReturnType | undefined
> => {
  try {
    const videoId = getTikTokVideoId(url);

    if (!videoId) {
      return undefined;
    }

    const response = await fetchTikTokEmbedPage({ videoId });

    if (!response.ok) {
      throw new Error("Failed to fetch TikTok embed metadata");
    }

    const html = await response.text();
    const videoData = findTikTokVideoData(parseFrontityConnectState(html));
    const title = videoData?.itemInfos?.text?.trim();
    const thumbnail = videoData?.itemInfos?.covers?.[0];
    const author =
      videoData?.authorInfos?.nickName || videoData?.authorInfos?.uniqueId;

    if (!title && !thumbnail) {
      return undefined;
    }

    return {
      author: author || "",
      title: title || "",
      thumbnail,
      url,
    };
  } catch (error) {
    ErrorHandler.logError({
      location: "getTikTokEmbedMetadata",
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
