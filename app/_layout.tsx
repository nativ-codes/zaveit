import MainStack from "@/common/containers/main-stack/main-stack";
import AuthProvider from "@/config/contexts/auth.context";
import { useFonts } from "expo-font";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
        <AuthProvider>
          <MainStack />
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
