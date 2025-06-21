import { SCREEN_OPTIONS } from "@/common/constants";
import { useAuth } from "@/config/contexts/auth.context";
import { router, Stack } from "expo-router";
import { useEffect } from "react";

function MainStack() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated]);

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