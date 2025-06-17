import { TopBar, UpdatePostDetails } from "@/common/components";
import { styles } from "@/common/components/tag-item/tag-item.style";
import { IMAGE_PLACEHOLDER, PLATFORM_CONFIGS } from "@/common/constants";
import { TabLayout } from "@/common/layouts";
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
import { Text, TouchableOpacity, View } from "react-native";
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
  availableTags: string[];
  selectedTags: string[];
};

const parseTags = async (title: string): Promise<ParseTagsReturnType> => {
  const localTags = getTags();
  const suggestedTags = await getSuggestedTags(title);

  return {
    selectedTags: suggestedTags,
    availableTags: [...new Set([...suggestedTags, ...localTags])],
  };
};

export default function ShareIntentScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [postMetadata, setPostMetadata] = useState<
    PostMetadataType | undefined
  >();
  const [tags, setTags] = useState<ParseTagsReturnType>({
    availableTags: [],
    selectedTags: [],
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
        tags: tags.selectedTags,
        timestamp: Date.now(),
      };
      await savePost(post);
    }
    resetShareIntent();
    router.replace("/");
  };

  const handleOnTagPress = (tag: string) => {
    setTags((prevTags) => ({
      ...prevTags,
      selectedTags: prevTags.selectedTags?.includes(tag)
        ? prevTags.selectedTags.filter((t) => t !== tag)
        : [...(prevTags.selectedTags || []), tag],
    }));
  };

  return (
    <TabLayout>
      <TopBar hasBackButton />
      {postMetadata && (
        <UpdatePostDetails
          title={postMetadata.title}
          author={postMetadata.author}
          url={postMetadata.url}
          thumbnail={postMetadata.thumbnail}
          availableTags={tags.availableTags}
          selectedTags={tags.selectedTags}
          onTagPress={handleOnTagPress}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Post</Text>
        </TouchableOpacity>
      </View>
    </TabLayout>
  );
}
