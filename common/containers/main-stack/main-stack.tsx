import { SCREEN_OPTIONS } from "@/common/constants";
import { useShareIntent } from "@/common/utils";
import { useAuth } from "@/config/contexts/auth.context";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

function MainStack() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useShareIntent({
    isAuthenticated,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (isAuthenticated) {
        router.replace("/");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, isMounted]);

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
