import { PostDetails, TopBar } from "@/common/components";
import {
  IMAGE_PLACEHOLDER,
  MAX_CONTENT_LENGTH,
  PLATFORM_CONFIGS,
} from "@/common/constants";
import { TabLayout } from "@/common/layouts";
import { savePost } from "@/config/storage/persistent";
import { generateTags } from "@/services/llm";
import {
  PlatformConfig,
  PostMetadataType,
  PostType,
  SocialPlatform
} from "@/types";
import { useRouter } from "expo-router";
import { ShareIntent, useShareIntentContext } from "expo-share-intent";
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

const getTags = async (title: string): Promise<string[]> => {
  const content = title.substring(0, MAX_CONTENT_LENGTH) || "";

  return generateTags(content);
};

const getMetadataFromShareIntent = (
  shareIntent: ShareIntent
): Partial<PostType> => {
  return {
    url: shareIntent.webUrl,
    title: shareIntent.meta.title || shareIntent.webUrl,
    author: shareIntent.meta.author || "Unknown",
    thumbnail: shareIntent.meta["og:image"] || IMAGE_PLACEHOLDER,
  };
};

export default function ShareIntentScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [metadata, setMetadata] = useState<PostMetadataType | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const platformConfig = shareIntent?.webUrl
    ? checkSocialPlatform(shareIntent.webUrl)
    : undefined;

  const handleOnSaveMetadata = async () => {
    if (shareIntent.meta) {
      setMetadata({
        url: shareIntent.webUrl || "",
        title: shareIntent.meta?.title || shareIntent.webUrl || "",
        author: shareIntent.meta?.author || "Unknown",
        thumbnail: shareIntent.meta?.["og:image"] || IMAGE_PLACEHOLDER,
      });

      if (shareIntent.meta?.title) {
        const tags = await getTags(shareIntent.meta.title);
        console.log(">> tags", JSON.stringify(tags));
        setTags(tags);
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

      setMetadata({
        author: data.author_name,
        title: data.title,
        thumbnail: data.thumbnail_url,
        url: shareIntent.webUrl || "",
      });

      if (data.title) {
        const tags = await getTags(data.title);
        setTags(tags);
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
      const post: Partial<PostType> = {
        id: uuid(),
        url: shareIntent.webUrl,
        title: metadata?.title || "",
        author: metadata?.author || "",
        thumbnail: metadata?.thumbnail || "",
        timestamp: Date.now(),
      };
      await savePost(post);
    }
    resetShareIntent();
    router.replace("/");
  };

  return (
    <TabLayout>
      <TopBar hasBackButton />
      {metadata && <PostDetails post={metadata as PostType} />}
    </TabLayout>
  );
}
