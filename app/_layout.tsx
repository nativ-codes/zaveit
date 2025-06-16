import { SCREEN_OPTIONS } from "@/common/constants";
import { AuthProvider } from "@/config/contexts/auth.context";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ShareIntentProvider
      options={{
        resetOnBackground: true,
        onResetShareIntent: () =>
          // used when app going in background and when the reset button is pressed
          router.replace({
            pathname: "/",
          }),
      }}
    >
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={SCREEN_OPTIONS}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="post-details" />
            <Stack.Screen name="view-posts" />
            <Stack.Screen
              name="login"
              options={{
                presentation: "modal",
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
