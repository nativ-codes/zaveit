// prettier-ignore
import "@/config/storage/storage";

import MainStack from "@/common/containers/main-stack/main-stack";
import { initializeAppCheck } from "@/config/app-check";
import AuthProvider from "@/config/contexts/auth.context";
import { initializeGoogleSignIn } from "@/services/google-auth.service";
import { useFonts } from "expo-font";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../dev/reactotron-config");
}

// At app start, not on the login screen: log out needs it in sessions that never open login.
initializeGoogleSignIn();

// Started early so the first share does not wait for attestation.
initializeAppCheck().catch(() => {
  // getAppCheckToken retries and reports the failure.
});

export default function RootLayout() {
  const [loaded] = useFonts({
    Gellix: require("../assets/fonts/Gellix-Regular.ttf"),
    GellixBold: require("../assets/fonts/Gellix-Bold.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ShareIntentProvider>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AuthProvider>
            <MainStack />
            <StatusBar style="dark" />
          </AuthProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
