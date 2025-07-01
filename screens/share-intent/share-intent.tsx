import { Button, TopBar, UpdatePostDetails } from "@/common/components";
import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { safelyPrintError, toggleTag } from "@/common/utils/misc";
import { savePost } from "@/config/storage/persistent";
import { PlatformConfig, PostMetadataType, PostType } from "@/types";
import * as Burnt from "burnt";

import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { getOEmbedMetadata } from "./share-intent.service";
import {
  checkSocialPlatform,
  parseTags,
  ParseTagsReturnType,
} from "./share-intent.utils";

// TODO check if there are shareIntents
function ShareIntentScreen() {
  console.log("ShareIntentScreen");
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

  useEffect(() => {
    return () => resetShareIntent();
  }, [resetShareIntent]);

  const platformConfig = useMemo(
    () => checkSocialPlatform(shareIntent?.webUrl as string),
    [shareIntent?.webUrl]
  );

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
        setTags(response);
      }
    } else {
      handleOnError(new Error("No metadata provided"));
    }
  };

  const handleOnError = (error: Error) => {
    console.error(safelyPrintError(error));
    Burnt.toast({
      title: "Unable to fetch metadata",
      message: "Please try again later.",
      preset: "error",
      duration: 5,
      haptic: "error",
    });
    resetShareIntent();
    router.replace("/");
    // TODO: Add error logging
  };

  const handleOnSaveOEmbedData = async () => {
    try {
      const data = await getOEmbedMetadata({
        platformConfig: platformConfig as PlatformConfig,
        url: shareIntent.webUrl || "",
      });

      setPostMetadata(data);

      if (data.title) {
        const response = await parseTags(data.title);
        setTags(response);
      }
    } catch (_) {
      handleOnSaveMetadata();
    }
  };

  useEffect(() => {
    const fetchOEmbedData = async () => {
      if (!shareIntent?.webUrl) {
        return;
      }

      if (!platformConfig) {
        await handleOnSaveMetadata();
      } else {
        await handleOnSaveOEmbedData();
      }
    };

    fetchOEmbedData();
  }, [platformConfig, shareIntent?.webUrl]);

  const handleSave = async () => {
    try {
      if (postMetadata?.url) {
        const post: PostType = {
          id: uuid(),
          url: postMetadata?.url || "",
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
      Burnt.toast({
        title: "Zaved successfully!",
        preset: "done",
        duration: 2,
        haptic: "success",
      });
    } catch (error) {
      handleOnError(error as Error);
    }
  };

  const handleOnMainTagPress = (tag: string) => {
    setTags((prevTags) => ({
      ...prevTags,
      selectedMainTags: toggleTag({
        tags: prevTags.selectedMainTags,
        tag,
      }),
    }));
  };

  const handleOnAdditionalTagPress = (tag: string) => {
    setTags((prevTags) => ({
      ...prevTags,
      selectedAdditionalTags: toggleTag({
        tags: prevTags.selectedAdditionalTags,
        tag,
      }),
    }));
  };

  return (
    <ScreenLayout
      footer={
        <Spacer gap="s16" direction="horizontal" size="s16">
          <Button
            label="Zave IT"
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

export default ShareIntentScreen;
