import { PlatformConfig } from "@/types/posts";

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

type FetchTikTokEmbedPageType = {
  videoId: string;
};

export const fetchTikTokEmbedPage = async ({
  videoId,
}: FetchTikTokEmbedPageType): Promise<Response> => {
  return fetch(`https://www.tiktok.com/embed/v2/${videoId}`, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
};

export const fetchServerMetadata = async (url: string): Promise<Response> => {
  const apiUrl = process.env.EXPO_PUBLIC_METADATA_API_URL;
  const encodedUrl = encodeURIComponent(url || "");

  return fetch(`${apiUrl}?url=${encodedUrl}`);
};

export const getSuggestedTags = async (content: string): Promise<string[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TAGS_TIMEOUT_MS);

  try {
    const response = await fetch(process.env.EXPO_PUBLIC_TAGS_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
