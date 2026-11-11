import { ApiEndpoints } from "@/config/api";
import { getAppCheckToken } from "@/config/app-check";
import { PlatformConfig } from "@/types/posts";
import { Platform } from "react-native";

const TAGS_TIMEOUT_MS = 5000;

type FetchOEmbedMetadataType = {
  url: string;
  platformConfig: PlatformConfig;
};

export const fetchOEmbedMetadata = async ({
  url,
  platformConfig,
}: FetchOEmbedMetadataType): Promise<Response> => {
  const encodedUrl = encodeURIComponent(url || "");
  const response = await fetch(
    `${platformConfig.oembedEndpoint}?url=${encodedUrl}&format=json`
  );

  return response;
};

type FetchTikTokVideoPageType = {
  videoId: string;
};

// Photo posts only carry their cover under /video/, and the page answers without the username.
export const fetchTikTokVideoPage = async ({
  videoId,
}: FetchTikTokVideoPageType): Promise<Response> => {
  return fetch(`https://www.tiktok.com/@/video/${videoId}`, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
};

// Fetched from the phone itself: some sites (Instagram) show the server a login wall instead of the post.
export const fetchPage = (url: string): Promise<Response> =>
  fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": Platform.select({
        ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        default:
          "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
      }),
    },
  });

export const fetchServerMetadata = async (url: string): Promise<Response> => {
  const encodedUrl = encodeURIComponent(url || "");

  return fetch(`${ApiEndpoints.metadata}?url=${encodedUrl}`, {
    headers: { "X-Firebase-AppCheck": await getAppCheckToken() },
  });
};

export const getSuggestedTags = async (content: string): Promise<string[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TAGS_TIMEOUT_MS);

  try {
    const response = await fetch(ApiEndpoints.tags, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": await getAppCheckToken(),
      },
      body: JSON.stringify({ title: content }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Tags API error: ${response.status}`);
    }

    const data = await response.json();

    return data.tags ?? [];
  } catch (error) {
    console.error("Error generating tags:", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
};
