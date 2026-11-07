import { SCREEN_OPTIONS } from "@/common/constants";
import { useShareIntent } from "@/common/utils";
import { setMixpanelUserId } from "@/config/analytics";
import { useAuth } from "@/config/contexts/auth.context";
import { clearPendingPost, getPendingPost } from "@/config/storage/pending-post";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import PendingPostModal from "./pending-post-modal";

// Held until Firebase reports the user, so no screen shows before the guards below know where to go.
SplashScreen.preventAutoHideAsync();

function MainStack() {
  const { isAuthenticated, isLoading } = useAuth();

  const [pendingPostUrl, setPendingPostUrl] = useState<string>();

  useShareIntent();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    SplashScreen.hideAsync();

    if (isAuthenticated) {
      setMixpanelUserId();
      setPendingPostUrl(getPendingPost());
    }
  }, [isAuthenticated, isLoading]);

  // Cleared on either choice, so the prompt never repeats.
  const closePendingPost = () => {
    clearPendingPost();
    setPendingPostUrl(undefined);
  };

  const handleOnSavePendingPost = () => {
    const url = pendingPostUrl;
    closePendingPost();
    router.navigate({ pathname: "/share-intent", params: { url } });
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* The router sends users to the first screen their guard allows, so no manual redirects. */}
      <Stack screenOptions={SCREEN_OPTIONS}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post-details" />
          <Stack.Screen name="view-posts" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="publish" />
          <Stack.Screen name="new-list" />
          <Stack.Screen name="manage-list" />
          <Stack.Screen name="share-intent" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <PendingPostModal
        url={pendingPostUrl}
        onSave={handleOnSavePendingPost}
        onDiscard={closePendingPost}
      />
    </>
  );
}

export default MainStack;
