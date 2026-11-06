import { Button } from "@/common/components";
import { Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { safelyPrintError } from "@/common/utils";
import { Analytics } from "@/config/analytics";
import { ErrorHandler } from "@/config/errors";
import {
  forgetFormerSignedOutUser,
  isFormerSignedOutUser,
  setInitialUserId,
} from "@/config/storage";
import { signInWithApple } from "@/services/apple-auth.service";
import { signInWithGoogle } from "@/services/google-auth.service";
import { syncPosts } from "@/services/login.service";
import * as Burnt from "burnt";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./login.style";
import { SignInProviderEnum } from "./login.type";
import WhatChangedModal from "./what-changed-modal";

function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Read once per mount, so it shows every time the login screen opens until sign-in deletes the key.
  const [isWhatChangedVisible, setIsWhatChangedVisible] = useState(isFormerSignedOutUser);

  const handleSignIn = (authType: SignInProviderEnum) => async () => {
    try {
      const signByAuthType =
        authType === SignInProviderEnum.google ? signInWithGoogle : signInWithApple;
      const userUUID = await signByAuthType();

      // No user means the user cancelled, which is not an error.
      if (userUUID) {
        forgetFormerSignedOutUser();
        setInitialUserId();
        syncPosts();
        Analytics.sendEvent(Analytics.events.logged_in, { authType });
        router.replace("/");
      }
    } catch (error) {
      ErrorHandler.logError({
        location: "handleSignIn",
        error: safelyPrintError(error),
        metadata: {
          authType,
        },
      });
      Burnt.toast({
        title: "Unable to sign in",
        message: "Please try again later.",
        preset: "error",
        duration: 5,
        haptic: "error",
      });
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
            style={styles.logo}
          />
          <Spacer gap="s8" style={GeneralStyles.centerContent}>
            <Text style={GeneralStyles.textTitleScreenPrimary}>ZaveIt</Text>
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
        style={StyleSheet.compose(styles.buttonsWrapper, {
          paddingBottom: insets.bottom + Units.s16,
        })}
      >
        <Button.Social
          label="Continue with Google"
          iconName="google"
          onPress={handleSignIn(SignInProviderEnum.google)}
        />
        {Platform.OS === "ios" && (
          <Button.Social
            label="Continue with Apple"
            iconName="apple"
            onPress={handleSignIn(SignInProviderEnum.apple)}
          />
        )}
      </Spacer>
      <WhatChangedModal
        isVisible={isWhatChangedVisible}
        onClose={() => setIsWhatChangedVisible(false)}
      />
    </View>
  );
}

export default LoginScreen;
