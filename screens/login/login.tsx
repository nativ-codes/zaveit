import { Button } from "@/common/components";
import { Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { setAppAuthType } from "@/config/storage/auth";
import {
  initializeGoogleSignIn,
  signInWithGoogle,
} from "@/services/google-auth.service";
import { syncPosts } from "@/services/posts.service";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./login.style";

function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { user } = await signInWithGoogle();
      await syncPosts({ uid: user.uid });

      if (user) {
        router.replace("/");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleContinueWithoutAccount = () => {
    setAppAuthType("anonymous");
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
            style={styles.logo}
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
          gap: Units.s16,
          alignItems: "center",
          paddingBottom: insets.bottom + Units.s16,
        }}
      >
        <Button.Social
          label="Continue with Google"
          iconName="google"
          onPress={handleGoogleSignIn}
        />
        <TouchableOpacity
          onPress={handleContinueWithoutAccount}
          hitSlop={Units.s16}
        >
          <Text style={GeneralStyles.textLabelMediumSecondary}>
            Continue without account
          </Text>
        </TouchableOpacity>
      </Spacer>
    </View>
  );
}

export default LoginScreen;
