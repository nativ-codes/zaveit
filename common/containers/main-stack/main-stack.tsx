import { SCREEN_OPTIONS } from "@/common/constants";
import { useShareIntent } from "@/common/utils";
import { setMixpanelUserId } from "@/config/analytics";
import { useAuth } from "@/config/contexts/auth.context";
import { useAppAuthType } from "@/config/storage";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

function MainStack() {
  const { isAuthenticated, isLoading } = useAuth();
  const appAuthType = useAppAuthType();

  const [isMounted, setIsMounted] = useState(false);
  const shouldBeRedirectedToHome = isAuthenticated || Boolean(appAuthType);

  useShareIntent();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (shouldBeRedirectedToHome) {
        setMixpanelUserId();
        router.replace("/");
      } else {
        router.replace("/login");
      }
    }
  }, [shouldBeRedirectedToHome, isLoading, isMounted]);

  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="post-details" />
      <Stack.Screen name="view-posts" />
    </Stack>
  );
}

export default MainStack;
