import {
  Button,
  SpinningLoader,
  TopBar,
  UpdatePostDetails,
} from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { safelyPrintError } from "@/common/utils/error-parsers";
import { toggleTag } from "@/common/utils/misc";
import { savePost } from "@/config/storage";
import { PostMetadataType, PostType } from "@/types";
import * as Burnt from "burnt";

import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import { getDomainFromUrl } from "@/common/utils";
import { saveImageFromUrl } from "@/common/utils/files";
import { Analytics } from "@/config/analytics";
import { ErrorHandler } from "@/config/errors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuid } from "uuid";
import styles from "./share-intent.style";
import { ShareIntentPropsType } from "./share-intent.type";
import {
  getMetadata,
  parseTags,
  ParseTagsReturnType,
} from "./share-intent.utils";

function ShareIntentScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const { url } = useLocalSearchParams<ShareIntentPropsType>();

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
  const [isLoading, setIsLoading] = useState(false);

  const isSaveDisabled = !Boolean(tags.selectedMainTags.length) || isLoading;
  const isSaveLoading = !Boolean(tags.mainTags.length) || isLoading;

  const handleOnError = (error: Error) => {
    ErrorHandler.logError({
      location: "handleOnError",
      error: safelyPrintError(error),
    });
    Burnt.toast({
      title: "Unable to fetch metadata",
      message: "Please try again later.",
      preset: "error",
      duration: 5,
      haptic: "error",
    });
    resetShareIntent();
    router.replace("/");
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!shareIntent?.webUrl && !url) {
        return;
      }

      try {
        const data = await getMetadata(
          shareIntent.webUrl ? shareIntent : { webUrl: url }
        );
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
  }, [shareIntent, url]);

  const handleSave = async () => {
    try {
      if (postMetadata?.url) {
        const postId = uuid();

        const post: PostType = {
          id: postId,
          url: postMetadata?.url || "",
          title: postMetadata?.title || "",
          author: postMetadata?.author || "",
          tags: [...tags.selectedMainTags, ...tags.selectedAdditionalTags],
          timestamp: Date.now(),
        };
        setIsLoading(true);

        if (postMetadata?.thumbnail) {
          await saveImageFromUrl(postMetadata?.thumbnail, postId);
        }

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
    } finally {
      setIsLoading(false);
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
            label="ZaveIt"
            type="primary"
            onPress={handleSave}
            isDisabled={isSaveDisabled}
            isLoading={isSaveLoading}
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
          thumbnail={postMetadata.thumbnail || IMAGE_PLACEHOLDER}
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
