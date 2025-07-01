import { Button } from "@/common/components";
import { Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  initializeGoogleSignIn,
  signInWithGoogle,
} from "@/services/google-auth.service";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    // Initialize Google Sign In
    initializeGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { user } = await signInWithGoogle();
      if (user) {
        // Navigate to home screen after successful login
        router.replace("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={StyleSheet.compose(
          GeneralStyles.flex,
          GeneralStyles.centerContent
        )}
      >
        <Spacer
          gap="s32"
          direction="horizontal"
          size="s32"
          style={GeneralStyles.centerContent}
        >
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={{
              width: Units.s128,
              height: Units.s128,
            }}
          />
          <Spacer gap="s8" style={GeneralStyles.centerContent}>
            <Text style={GeneralStyles.textTitleScreenPrimary}>ZaveIT</Text>
            <Text
              style={StyleSheet.compose(
                GeneralStyles.textLabelLargeSecondary,
                GeneralStyles.textCenter
              )}
            >
              Your smart bookmark manager
            </Text>
          </Spacer>
        </Spacer>
      </View>
      <Spacer
        direction="horizontal"
        size="s16"
        style={{
          paddingBottom: insets.bottom + Units.s16,
          flexDirection: "row",
        }}
      >
        <Button.Social
          label="Continue with Google"
          iconName="google"
          onPress={handleGoogleSignIn}
        />
      </Spacer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
