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
  thumbnail: string;
  timestamp: number;
  tags: string[];
};

export type FrequentlyAccessedPostsType = Record<string, number>;

export type ThumbnailType = {
  id: string;
  url: string;
};

export type PostMetadataType = Omit<PostType, "id" | "timestamp" | "tags">;
