import {
  IMAGE_PLACEHOLDER,
  MAIN_TAGS,
  PLATFORM_CONFIGS,
} from "@/common/constants";
import { getIsEmpty } from "@/common/utils";
import { getTags } from "@/config/storage/persistent";
import { getSuggestedTags } from "@/services/llm";
import { PlatformConfig, PostMetadataType, SocialPlatform } from "@/types";
import { ShareIntent } from "expo-share-intent";
import {
  getCustomLinkPreviewMetadata,
  getLinkPreviewMetadata,
  getOEmbedMetadata,
} from "./share-intent.service";

export const checkSocialPlatform = (
  url: string
): PlatformConfig | undefined => {
  if (!url) return undefined;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace("www.", "");

    const platformConfig = Object.keys(PLATFORM_CONFIGS).find((key) =>
      PLATFORM_CONFIGS[key as SocialPlatform].domains.includes(domain)
    );

    return platformConfig
      ? PLATFORM_CONFIGS[platformConfig as SocialPlatform]
      : undefined;
  } catch (error) {
    return undefined;
  }
};

export type ParseTagsReturnType = {
  additionalTags: string[];
  selectedAdditionalTags: string[];
  selectedMainTags: string[];
  mainTags: string[];
};

export const parseTags = async (
  title: string
): Promise<ParseTagsReturnType> => {
  const localTags = getTags();
  const suggestedTags = await getSuggestedTags(title);

  // Filter suggested tags that are also in MAIN_TAGS
  const selectedMainTags = suggestedTags.filter((tag) =>
    MAIN_TAGS.includes(tag.toLowerCase())
  );

  // Filter suggested tags that are NOT in MAIN_TAGS
  const selectedAdditionalTags = suggestedTags.filter(
    (tag) => !MAIN_TAGS.includes(tag.toLowerCase())
  );

  // Filter local tags that are NOT in MAIN_TAGS and make them unique
  const localAdditionalTags = [
    ...new Set(
      localTags.filter((tag) => !MAIN_TAGS.includes(tag.toLowerCase()))
    ),
  ];

  // Create mainTags list with selectedMainTags at the beginning
  const mainTags = [
    ...selectedMainTags,
    ...MAIN_TAGS.filter((tag) => !selectedMainTags.includes(tag)),
  ];

  // Create additionalTags list with selectedAdditionalTags at the beginning
  const additionalTags = [
    ...selectedAdditionalTags,
    ...localAdditionalTags.filter(
      (tag) => !selectedAdditionalTags.includes(tag)
    ),
  ];

  return {
    selectedAdditionalTags,
    selectedMainTags,
    additionalTags,
    mainTags,
  };
};

export const getMetadata = async (
  shareIntent: ShareIntent
): Promise<PostMetadataType> => {
  if (!shareIntent.webUrl) {
    throw new Error("No URL provided");
  }
  
  const platformConfig = checkSocialPlatform(shareIntent.webUrl);
  if (platformConfig) {
    const data = await getOEmbedMetadata({
      platformConfig: platformConfig as PlatformConfig,
      url: shareIntent.webUrl,
    });

    if (data) {
      return data;
    }
  }

  if (!getIsEmpty(shareIntent.meta)) {
    return {
      url: shareIntent.webUrl || "",
      title: shareIntent.meta?.title || shareIntent.webUrl || "",
      author: shareIntent.meta?.author || "",
      thumbnail: shareIntent.meta?.["og:image"] || IMAGE_PLACEHOLDER
    };
  }

  const customLinkPreviewMetadata = await getCustomLinkPreviewMetadata({
    url: shareIntent.webUrl,
  });

  if (customLinkPreviewMetadata?.title) {
    return {
      url: shareIntent.webUrl || "",
      title: customLinkPreviewMetadata.title || shareIntent.webUrl || "",
      author: "",
      thumbnail: customLinkPreviewMetadata.thumbnail || IMAGE_PLACEHOLDER,
    };
  }

  const linkPreviewMetadata = await getLinkPreviewMetadata({
    url: shareIntent.webUrl,
  });

  if (linkPreviewMetadata?.title) {
    return {
      url: shareIntent.webUrl || "",
      title: linkPreviewMetadata.title || shareIntent.webUrl || "",
      author: "",
      thumbnail: linkPreviewMetadata.image || IMAGE_PLACEHOLDER
    };
  }

  throw new Error("URL not supported");
};
