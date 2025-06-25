import { MAIN_TAGS, PLATFORM_CONFIGS } from "@/common/constants";
import { getTags } from "@/config/storage/persistent";
import { getSuggestedTags } from "@/services/llm";
import { PlatformConfig, SocialPlatform } from "@/types";

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

    return platformConfig ? PLATFORM_CONFIGS[platformConfig as SocialPlatform] : undefined;
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

export const parseTags = async (title: string): Promise<ParseTagsReturnType> => {
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
