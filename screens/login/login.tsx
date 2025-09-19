import { Button } from "@/common/components";
import { Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { safelyPrintError } from "@/common/utils";
import { Analytics } from "@/config/analytics";
import { ErrorHandler } from "@/config/errors";
import { setAppAuthType, setInitialUserId } from "@/config/storage";
import { signInWithApple } from "@/services/apple-auth.service";
import {
  initializeGoogleSignIn,
  signInWithGoogle,
} from "@/services/google-auth.service";
import { AppAuthType } from "@/types";
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

  const handleSignIn = (authType: AppAuthType) => async () => {
    try {
      if (authType !== "google" && authType !== "apple") {
        throw new Error("Invalid auth type");
      }

      const signByAuthType =
        authType === "google" ? signInWithGoogle : signInWithApple;
      const userUUID = await signByAuthType();

      if (userUUID) {
        setAppAuthType(authType);
        setInitialUserId();
        Analytics.sendEvent(Analytics.events.logged_in, { authType });
        router.replace("/");
      } else {
        console.error("Sign in failed");
      }
    } catch (error) {
      ErrorHandler.logError({
        location: "handleSignIn",
        error: safelyPrintError(error),
        metadata: {
          authType,
        },
      });
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
          onPress={handleSignIn("google")}
        />
        <Button.Social
          label="Continue with Apple"
          iconName="apple1"
          onPress={handleSignIn("apple")}
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
