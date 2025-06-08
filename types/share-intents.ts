export enum SocialPlatform {
  TIKTOK = 'TIKTOK',
  REDDIT = 'REDDIT',
  YOUTUBE = 'YOUTUBE',
  UNKNOWN = 'UNKNOWN'
}

export interface PlatformConfig {
  platform: SocialPlatform;
  domains: string[];
  oembedEndpoint: string;
}

export interface OEmbedData {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
  width?: number;
  height?: number;
  version?: string;
  type?: string;
  cache_age?: number;
}

export interface StoredShareIntent {
  id: string;
  url: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  timestamp: number;
  metadata?: OEmbedData;
  tags: string[];
}

export type ShareIntentMetadata = {
  title?: string;
  'og:image'?: string;
};

export interface ShareIntentResponse {
  type: string;
  text?: string;
  webUrl?: string;
  files?: string[];
  metadata?: ShareIntentMetadata;
}

// Platform-specific types
export interface YouTubeMetadata extends OEmbedData {
  provider_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

export interface TikTokMetadata extends OEmbedData {
  video_id: string;
  author_url: string;
}

export interface RedditMetadata extends OEmbedData {
  subreddit: string;
  score: number;
  num_comments: number;
}
