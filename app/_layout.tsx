import { AuthProvider } from "@/config/contexts/auth.context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import "react-native-get-random-values";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
        debug: true,
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
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => router.push("/login")}
                      style={{ marginRight: 16 }}
                    >
                      <Ionicons
                        name="log-in-outline"
                        size={24}
                        color={colorScheme === "dark" ? "#fff" : "#000"}
                      />
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
