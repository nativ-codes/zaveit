import { safelyPrintError } from "@/common/utils/error-parsers";
import { forceHttps } from "@/common/utils/formatters";
import { ErrorHandler } from "@/config/errors";
import { savePost } from "@/config/storage/posts";
import {
  fetchServerMetadata,
  fetchOEmbedMetadata,
  fetchPage,
  fetchTikTokVideoPage,
} from "@/services/general.service";
import { makeThumbnail, uploadThumbnail } from "@/services/thumbnails.service";
import { PlatformConfig, PostType } from "@/types";

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

type TikTokItemStructType = {
  desc?: string;
  video?: { cover?: string };
  author?: { nickname?: string; uniqueId?: string };
};

const getTikTokVideoId = (url: string): string | undefined => {
  const match = url.match(/\/(?:video|photo)\/(\d+)/);
  return match?.[1];
};

// The embed page and oEmbed stopped carrying the cover in Nov 2026; the video page's rehydration data still does.
const findTikTokItem = (html: string): TikTokItemStructType | undefined => {
  const match = html.match(
    /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!match?.[1]) {
    return undefined;
  }

  return JSON.parse(match[1])?.__DEFAULT_SCOPE__?.["webapp.video-detail"]
    ?.itemInfo?.itemStruct;
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

    const response = await fetchTikTokVideoPage({ videoId });

    if (!response.ok) {
      throw new Error("Failed to fetch TikTok video page");
    }

    const item = findTikTokItem(await response.text());
    const title = item?.desc?.trim();
    const thumbnail = item?.video?.cover;
    const author = item?.author?.nickname || item?.author?.uniqueId;

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

type GetServerMetadataReturnType = {
  title: string;
  thumbnail: string;
};

type GetServerMetadataType = {
  url: string;
};

export const getServerMetadata = async ({
  url,
}: GetServerMetadataType): Promise<
  GetServerMetadataReturnType | undefined
> => {
  try {
    const response = await fetchServerMetadata(url);

    if (!response.ok) {
      throw new Error("Failed to fetch server metadata");
    }

    const data = await response.json();

    return {
      title: data.title || "",
      thumbnail: data.thumbnail || data.image || "",
    };
  } catch (error) {
    ErrorHandler.logError({
      location: "getServerMetadata",
      error: safelyPrintError(error),
      metadata: {
        url,
      },
    });
    return undefined;
  }
};

const decodeEntities = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");

// Reads og:title and og:image (or twitter:image) the way the server's pageTags does.
export const parsePageTags = (
  html: string,
  pageUrl: string
): { title: string; thumbnail: string } => {
  const tags: Record<string, string> = {};

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];

    if (name && content && !tags[name.toLowerCase()]) {
      tags[name.toLowerCase()] = decodeEntities(content);
    }
  }

  const picture = tags["og:image"] || tags["twitter:image"];

  return {
    title: (tags["og:title"] || "").trim(),
    thumbnail: picture ? new URL(picture, pageUrl).href : "",
  };
};

export const getDeviceMetadata = async ({
  url,
}: GetServerMetadataType): Promise<GetServerMetadataReturnType | undefined> => {
  try {
    const response = await fetchPage(url);

    if (!response.ok) {
      throw new Error(`Page answered ${response.status}`);
    }

    return parsePageTags(await response.text(), url);
  } catch (error) {
    ErrorHandler.logError({
      location: "getDeviceMetadata",
      error: safelyPrintError(error),
      metadata: { url },
    });
    return undefined;
  }
};

export const THUMBNAIL_UPLOAD_TIMEOUT_MS = 20000;

// Never rejects or hangs: a failed or slow upload means the Post is saved without a Thumbnail.
export const startThumbnailUpload = async (
  sourceUrl?: string
): Promise<string | undefined> => {
  if (!sourceUrl) {
    return undefined;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Thumbnail upload timed out")),
      THUMBNAIL_UPLOAD_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([
      makeThumbnail(forceHttps(sourceUrl)).then(uploadThumbnail),
      timeout,
    ]);
  } catch (error) {
    ErrorHandler.logError({
      location: "startThumbnailUpload",
      error: safelyPrintError(error),
      metadata: { sourceUrl },
    });
    return undefined;
  } finally {
    clearTimeout(timer);
  }
};

// Waits for the upload the screen already started, so Save never starts a second one.
export const saveNewPost = async (
  post: PostType,
  thumbnailUpload: Promise<string | undefined>
): Promise<void> => {
  const thumbnailUrl = await thumbnailUpload;
  await savePost(thumbnailUrl ? { ...post, thumbnailUrl } : post);
};
