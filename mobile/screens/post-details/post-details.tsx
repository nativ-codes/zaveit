import { Button, EmptyPlaceholder, PostDetails } from "@/common/components";
import { ACTIVE_OPACITY } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { safelyPrintError } from "@/common/utils";
import { Haptics } from "@/common/utils/haptics";
import { ErrorHandler } from "@/config/errors";
import {
  increasePostAccessCount,
  removePost,
  usePosts,
} from "@/config/storage";
import { PostType } from "@/types";
import Icon from "@expo/vector-icons/Feather";
import * as Burnt from "burnt";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPostDetails } from "../search/search.util";
import { reloadThumbnail } from "./post-details.service";
import styles from "./post-details.style";
import { PostDetailsPropsType } from "./post-details.type";

function PostDetailsScreen() {
  const { id } = useLocalSearchParams<PostDetailsPropsType>();
  const posts = usePosts();
  const post = getPostDetails({ posts, id }) as PostType;
  const insets = useSafeAreaInsets();
  const [isReloadingImage, setIsReloadingImage] = useState(false);
  // Keyed by URL so a successful reload (new URL) hides the button again.
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string>();
  const showsPlaceholder =
    !post?.thumbnailUrl || failedThumbnailUrl === post.thumbnailUrl;
  // By id: every posts update brings a new object, which isn't another visit.
  const postId = post?.id;
  useEffect(() => {
    if (postId) {
      increasePostAccessCount(postId);
    }
  }, [postId]);

  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(post.url);
    } catch (error) {
      ErrorHandler.logError({
        location: "handleOpenInBrowser",
        error: safelyPrintError(error),
        metadata: {
          post,
        },
      });
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/");
    }
  };

  const handleReloadImage = async () => {
    setIsReloadingImage(true);
    try {
      await reloadThumbnail(post);
      Haptics.success();
    } catch (error) {
      ErrorHandler.logError({
        location: "handleReloadImage",
        error: safelyPrintError(error),
        metadata: { post },
      });
      Burnt.toast({
        title: "Unable to reload image",
        message: "Please try again later.",
        preset: "error",
        duration: 5,
      });
      Haptics.error();
    } finally {
      setIsReloadingImage(false);
    }
  };

  const handleOnRemovePost = () => {
    Alert.alert("Remove Post", "Are you sure you want to remove this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removePost(post);
          Haptics.warning();
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      hasTopInset={false}
      footer={
        <Spacer
          style={GeneralStyles.directionRow}
          gap="s16"
          direction="horizontal"
          size="s16"
        >
          <Button.Icon
            iconName="trash"
            onPress={handleOnRemovePost}
            theme="error"
            accessibilityLabel="Remove post"
          />
          <Button type="primary" label="Open" onPress={handleOpenInBrowser} />
        </Spacer>
      }
    >
      <TouchableOpacity
        activeOpacity={ACTIVE_OPACITY}
        onPress={goBack}
        style={StyleSheet.compose(styles.backButton, {
          top: insets.top + Units.s8,
        })}
        hitSlop={Units.s8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Icon name="arrow-left" size={Units.s20} color={Colors.white} />
      </TouchableOpacity>
      {post && showsPlaceholder && (
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleReloadImage}
          disabled={isReloadingImage}
          style={[
            styles.reloadButton,
            isReloadingImage && styles.reloadButtonDisabled,
          ]}
          hitSlop={Units.s8}
          accessibilityRole="button"
          accessibilityLabel="Reload image"
        >
          <Icon name="refresh-cw" size={Units.s16} color={Colors.white} />
        </TouchableOpacity>
      )}
      {post ? (
        <PostDetails {...post} onImageError={setFailedThumbnailUrl} />
      ) : (
        <View style={styles.errorContainer}>
          <EmptyPlaceholder
            message="Post not found"
            instruction="Please try again later"
          />
        </View>
      )}
    </ScreenLayout>
  );
}

export default PostDetailsScreen;
