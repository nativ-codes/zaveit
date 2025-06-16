import { PlatformConfig, SocialPlatform } from "@/types/posts";

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  [SocialPlatform.TIKTOK]: {
    platform: SocialPlatform.TIKTOK,
    domains: ["tiktok.com", "vm.tiktok.com"],
    oembedEndpoint: "https://www.tiktok.com/oembed"
  },
  [SocialPlatform.REDDIT]: {
    platform: SocialPlatform.REDDIT,
    domains: ["reddit.com"],
    oembedEndpoint: "https://www.reddit.com/oembed"
  },
  [SocialPlatform.YOUTUBE]: {
    platform: SocialPlatform.YOUTUBE,
    domains: ["youtube.com", "youtu.be"],
    oembedEndpoint: "https://www.youtube.com/oembed"
  },
  [SocialPlatform.UNKNOWN]: {
    platform: SocialPlatform.UNKNOWN,
    domains: [],
    oembedEndpoint: ""
  }
};
