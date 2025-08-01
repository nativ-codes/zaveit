import { SCREEN_OPTIONS } from "@/common/constants";
import { useShareIntent } from "@/common/utils";
import { useAuth } from "@/config/contexts/auth.context";
import { useAppAuthType } from "@/config/storage/auth";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

function MainStack() {
  const { isAuthenticated, isLoading } = useAuth();
  const appAuthType = useAppAuthType();

  const [isMounted, setIsMounted] = useState(false);

  useShareIntent();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (isAuthenticated || Boolean(appAuthType)) {
        router.replace("/");
      } else {
        console.log("redirecting to login");
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, isMounted, appAuthType]);

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
