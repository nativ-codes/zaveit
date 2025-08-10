import {
  Button,
  SpinningLoader,
  TopBar,
  UpdatePostDetails,
} from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { safelyPrintError, toggleTag } from "@/common/utils/misc";
import { savePost } from "@/config/storage/persistent";
import { PostMetadataType, PostType } from "@/types";
import * as Burnt from "burnt";

import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { Analytics } from "@/config/analytics";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuid } from "uuid";
import styles from "./share-intent.style";
import {
  getMetadata,
  parseTags,
  ParseTagsReturnType,
} from "./share-intent.utils";

// TODO check if there are shareIntents
function ShareIntentScreen() {
  console.log("ShareIntentScreen");
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [postMetadata, setPostMetadata] = useState<
    PostMetadataType | undefined
  >();

  const [tags, setTags] = useState<ParseTagsReturnType>({
    additionalTags: [],
    selectedAdditionalTags: [],
    selectedMainTags: [],
    mainTags: [],
  });

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

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!shareIntent?.webUrl) {
        return;
      }

      try {
        const data = await getMetadata(shareIntent);
        setPostMetadata(data);

        if (data?.title) {
          const response = await parseTags(data.title);
          setTags(response);
        }
      } catch (error) {
        handleOnError(error as Error);
      }
    };

    fetchMetadata();
  }, [shareIntent]);

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
          updatedAt: Date.now(),
        };
        await savePost(post);

        Analytics.sendEvent(Analytics.events.zaved_post, {
          platform: getDomainFromUrl(postMetadata?.url || ""),
          mainTags: tags.selectedMainTags.join(","),
          additionalTags: tags.selectedAdditionalTags.join(","),
        });
      }
      resetShareIntent();
      router.back();
      Burnt.toast({
        title: "Zaved it successfully!",
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
      hasTopInset={false}
      footer={
        <Spacer gap="s16" direction="horizontal" size="s16">
          <Button
            label="Zave IT"
            type="primary"
            onPress={handleSave}
            isDisabled={!Boolean(tags.selectedMainTags.length)}
            isLoading={!Boolean(tags.mainTags.length)}
          />
        </Spacer>
      }
    >
      <View
        style={StyleSheet.compose(styles.topBarContainer, {
          top: insets.top,
        })}
      >
        <TopBar hasBackButton />
      </View>
      {postMetadata ? (
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
      ) : (
        <View style={GeneralStyles.spinningLoaderContainer}>
          <SpinningLoader />
        </View>
      )}
    </ScreenLayout>
  );
}

export default ShareIntentScreen;
