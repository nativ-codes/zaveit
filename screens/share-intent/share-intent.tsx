import { Button, TopBar, UpdatePostDetails } from "@/common/components";
import {
  CATEGORIES,
  IMAGE_PLACEHOLDER,
  PLATFORM_CONFIGS,
} from "@/common/constants";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { getTags, savePost } from "@/config/storage/persistent";
import { getSuggestedTags } from "@/services/llm";
import {
  PlatformConfig,
  PostMetadataType,
  PostType,
  SocialPlatform,
} from "@/types";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export const checkSocialPlatform = (
  url: string
): PlatformConfig | undefined => {
  if (!url) return undefined;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace("www.", "");

    return PLATFORM_CONFIGS[domain as SocialPlatform];
  } catch (error) {
    return undefined;
  }
};

type ParseTagsReturnType = {
  additionalTags: string[];
  selectedAdditionalTags: string[];
  selectedMainTags: string[];
  mainTags: string[];
};

const parseTags = async (title: string): Promise<ParseTagsReturnType> => {
  const localTags = getTags();
  const suggestedTags = await getSuggestedTags(title);

  // Filter suggested tags that are also in CATEGORIES
  const selectedMainTags = suggestedTags.filter(tag => 
    CATEGORIES.includes(tag.toLowerCase())
  );

  // Filter suggested tags that are NOT in CATEGORIES
  const selectedAdditionalTags = suggestedTags.filter(tag => 
    !CATEGORIES.includes(tag.toLowerCase())
  );

  // Filter local tags that are NOT in CATEGORIES and make them unique
  const localAdditionalTags = [...new Set(
    localTags.filter(tag => !CATEGORIES.includes(tag.toLowerCase()))
  )];

  // Create mainTags list with selectedMainTags at the beginning
  const mainTags = [
    ...selectedMainTags,
    ...CATEGORIES.filter(tag => !selectedMainTags.includes(tag))
  ];

  // Create additionalTags list with selectedAdditionalTags at the beginning
  const additionalTags = [
    ...selectedAdditionalTags,
    ...localAdditionalTags.filter(tag => !selectedAdditionalTags.includes(tag))
  ];

  return {
    selectedAdditionalTags,
    selectedMainTags,
    additionalTags,
    mainTags,
  };
};

export default function ShareIntentScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [postMetadata, setPostMetadata] = useState<
    PostMetadataType | undefined
  >();
  const [tags, setTags] = useState<ParseTagsReturnType>({
    additionalTags: [],
    selectedAdditionalTags: [],
    selectedMainTags: [],
    mainTags: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformConfig = shareIntent?.webUrl
    ? checkSocialPlatform(shareIntent.webUrl)
    : undefined;

  const handleOnSaveMetadata = async () => {
    if (shareIntent.meta) {
      setPostMetadata({
        url: shareIntent.webUrl || "",
        title: shareIntent.meta?.title || shareIntent.webUrl || "",
        author: shareIntent.meta?.author || "Unknown",
        thumbnail: shareIntent.meta?.["og:image"] || IMAGE_PLACEHOLDER,
      });

      if (shareIntent.meta?.title) {
        const response = await parseTags(shareIntent.meta.title);
        console.log(">> tags", JSON.stringify(response));
        setTags(response);
      }
    } else {
      setError("No metadata available for this URL");
    }
  };

  const handleOnSaveOEmbedData = async () => {
    try {
      const response = await fetch(
        `${
          (platformConfig as PlatformConfig).oembedEndpoint
        }?url=${encodeURIComponent(shareIntent.webUrl || "")}&format=json`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }

      const data = await response.json();
      console.log(">> data", JSON.stringify(data));
      console.log(">> shareIntent.webUrl", shareIntent.webUrl);

      setPostMetadata({
        author: data.author_name,
        title: data.title,
        thumbnail: data.thumbnail_url,
        url: shareIntent.webUrl || "",
      });

      if (data.title) {
        const response = await parseTags(data.title);
        console.log(">> tags", JSON.stringify(response));
        setTags(response);
      }
    } catch (err) {
      console.log(">> oEmbed failed, falling back to shareIntent metadata");
      // Fallback to shareIntent metadata if available
      handleOnSaveMetadata();
    }
  };

  useEffect(() => {
    const fetchOEmbedData = async () => {
      if (!shareIntent?.webUrl) return;
      setIsLoading(true);
      setError(null);

      if (!platformConfig) {
        await handleOnSaveMetadata();
      } else {
        await handleOnSaveOEmbedData();
      }

      setIsLoading(false);
    };

    fetchOEmbedData();
  }, [platformConfig, shareIntent?.webUrl]);

  const handleSave = async () => {
    if (shareIntent?.webUrl) {
      // Save to local storage
      const post: PostType = {
        id: uuid(),
        url: shareIntent.webUrl,
        title: postMetadata?.title || "",
        author: postMetadata?.author || "",
        thumbnail: postMetadata?.thumbnail || "",
        tags: [...tags.selectedMainTags, ...tags.selectedAdditionalTags],
        timestamp: Date.now(),
      };
      await savePost(post);
    }
    resetShareIntent();
    router.replace("/");
  };

  const handleOnMainTagPress = (tag: string) => {
    setTags((prevTags) => ({
      ...prevTags,
      selectedMainTags: prevTags.selectedMainTags?.includes(tag)
        ? prevTags.selectedMainTags.filter((t) => t !== tag)
        : [...(prevTags.selectedMainTags || []), tag],
    }));
  };

  const handleOnAdditionalTagPress = (tag: string) => {
    setTags((prevTags) => ({
      ...prevTags,
      selectedAdditionalTags: prevTags.selectedAdditionalTags?.includes(tag)
        ? prevTags.selectedAdditionalTags.filter((t) => t !== tag)
        : [...(prevTags.selectedAdditionalTags || []), tag],
    }));
  };

   // TODO: disable button
  return (
    <ScreenLayout
      footer={
        <Spacer gap="s16" direction="horizontal" size="s16">
          <Button
            label="Zave It"
            onPress={handleSave}
            isDisabled={!Boolean(tags.mainTags.length)}
          />
        </Spacer>
      }
    >
      <TopBar hasBackButton />
      {postMetadata && (
        <UpdatePostDetails
          title={postMetadata.title}
          author={postMetadata.author}
          url={postMetadata.url}
          thumbnail={postMetadata.thumbnail}
          additionalTags={tags.additionalTags}
          selectedAdditionalTags={tags.selectedAdditionalTags}
          mainTags={tags.mainTags}
          selectedMainTags={tags.selectedMainTags}
          onMainTagPress={handleOnMainTagPress}
          onAdditionalTagPress={handleOnAdditionalTagPress}
          isLoading={!Boolean(tags.mainTags.length)}
        />
      )}
    </ScreenLayout>
  );
}
