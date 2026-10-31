import { MAIN_TAGS } from "@/common/constants";
import { safelyPrintError } from "@/common/utils/error-parsers";
import { getIsEmpty } from "@/common/utils/validators";
import { ErrorHandler } from "@/config/errors";
import { getTags } from "@/config/storage";
import { getSuggestedTags } from "@/services/general.service";
import { PostMetadataType } from "@/types";
import { ShareIntent } from "expo-share-intent";
import { getPlatformMetadata } from "./share-intent.platforms";
import {
  getLinkPreviewMetadata,
  getLocalLinkPreviewMetadata,
} from "./share-intent.service";

export type ParseTagsReturnType = {
  additionalTags: string[];
  selectedAdditionalTags: string[];
  selectedMainTags: string[];
  mainTags: string[];
};

export const parseTags = async (
  title: string,
  url: string
): Promise<ParseTagsReturnType> => {
  const localTags = getTags();
  // getMetadata falls back to the URL as title, which gives the model nothing to tag.
  const suggestedTags = title === url ? [] : await getSuggestedTags(title);

  // Filter suggested tags that are also in MAIN_TAGS
  const selectedMainTags = suggestedTags.filter((tag) =>
    MAIN_TAGS.includes(tag.toLowerCase() as (typeof MAIN_TAGS)[number])
  );

  // Filter suggested tags that are NOT in MAIN_TAGS
  const selectedAdditionalTags = suggestedTags.filter(
    (tag) =>
      !MAIN_TAGS.includes(tag.toLowerCase() as (typeof MAIN_TAGS)[number])
  );

  // Filter local tags that are NOT in MAIN_TAGS and make them unique
  const localAdditionalTags = [
    ...new Set(
      localTags.filter(
        (tag) =>
          !MAIN_TAGS.includes(tag.toLowerCase() as (typeof MAIN_TAGS)[number])
      )
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
  shareIntent: Partial<ShareIntent>
): Promise<PostMetadataType> => {
  if (!shareIntent.webUrl) {
    throw new Error("No URL provided");
  }

  const platformMetadata = await getPlatformMetadata(shareIntent.webUrl);

  if (platformMetadata) {
    return platformMetadata;
  }

  if (shareIntent?.meta && !getIsEmpty(shareIntent?.meta)) {
    return {
      url: shareIntent.webUrl || "",
      title: shareIntent.meta?.title || shareIntent.webUrl || "",
      author: shareIntent.meta?.author || "",
      thumbnail: shareIntent.meta?.["og:image"],
    };
  }

  const localLinkPreviewMetadata = await getLocalLinkPreviewMetadata({
    url: shareIntent.webUrl,
  });

  if (localLinkPreviewMetadata?.title) {
    return {
      url: shareIntent.webUrl || "",
      title: localLinkPreviewMetadata.title || shareIntent.webUrl || "",
      author: "",
      thumbnail: localLinkPreviewMetadata.thumbnail,
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
      thumbnail: linkPreviewMetadata.image,
    };
  }

  ErrorHandler.logError({
    location: "getMetadata",
    error: safelyPrintError(new Error("URL not supported")),
    metadata: {
      url: shareIntent.webUrl,
    },
  });
  throw new Error("URL not supported");
};
