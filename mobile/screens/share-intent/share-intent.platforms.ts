import { PlatformConfig, PostMetadataType, SocialPlatform } from "@/types";
import {
  getOEmbedMetadata,
  getTikTokEmbedMetadata,
} from "./share-intent.service";

type PlatformRule = PlatformConfig & {
  // Follow short/share links before calling the tools.
  resolveRedirects?: boolean;
  normalizeUrl?: (url: string) => string;
  // Tried in order; the first one that finds a title or thumbnail wins.
  tools: (typeof getOEmbedMetadata)[];
};

// A domain also matches all of its subdomains (reddit.com covers old.reddit.com).
const PLATFORM_RULES: PlatformRule[] = [
  {
    platform: SocialPlatform.TIKTOK,
    domains: ["tiktok.com"],
    oembedEndpoint: "https://www.tiktok.com/oembed",
    resolveRedirects: true,
    tools: [getTikTokEmbedMetadata, getOEmbedMetadata],
  },
  {
    platform: SocialPlatform.REDDIT,
    domains: ["reddit.com", "redd.it"],
    oembedEndpoint: "https://www.reddit.com/oembed",
    resolveRedirects: true,
    normalizeUrl: (url) =>
      url.replace(
        /^https?:\/\/(?:[^/]+\.)?reddit\.com/i,
        "https://www.reddit.com"
      ),
    tools: [getOEmbedMetadata],
  },
  {
    platform: SocialPlatform.YOUTUBE,
    domains: ["youtube.com", "youtu.be"],
    oembedEndpoint: "https://www.youtube.com/oembed",
    tools: [getOEmbedMetadata],
  },
];

const findPlatformRule = (url: string): PlatformRule | undefined => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    return PLATFORM_RULES.find(({ domains }) =>
      domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      )
    );
  } catch {
    return undefined;
  }
};

const resolveUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.url || url;
  } catch {
    return url;
  }
};

export const getPlatformMetadata = async (
  url: string
): Promise<PostMetadataType | undefined> => {
  const rule = findPlatformRule(url);

  if (!rule) {
    return undefined;
  }

  const resolvedUrl = rule.resolveRedirects ? await resolveUrl(url) : url;
  const toolUrl = rule.normalizeUrl?.(resolvedUrl) ?? resolvedUrl;

  for (const tool of rule.tools) {
    const data = await tool({ platformConfig: rule, url: toolUrl });

    if (data?.title || data?.thumbnail) {
      return {
        url,
        title: data.title || url,
        author: data.author || "",
        thumbnail: data.thumbnail,
      };
    }
  }

  return undefined;
};
