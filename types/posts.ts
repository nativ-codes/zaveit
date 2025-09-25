export enum SocialPlatform {
  TIKTOK = "tiktok.com",
  REDDIT = "reddit.com",
  YOUTUBE = "youtube.com",
  UNKNOWN = "unknown",
}

export interface PlatformConfig {
  platform: SocialPlatform;
  domains: string[];
  oembedEndpoint: string;
}

export type PostType = {
  id: string;
  url: string;
  title: string;
  author: string;
  timestamp: number;
  tags: string[];
};

export type FrequentlyAccessedPostsType = Record<string, number>;

export type PostMetadataType = Omit<PostType, "id" | "timestamp" | "tags"> & {
  thumbnail?: string;
};
