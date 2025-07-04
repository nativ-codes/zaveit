import { Menu, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { noop } from "@/common/utils";
import { clearAllData } from "@/config/storage/persistent";
import { signOut } from "@/services/google-auth.service";
import { deleteUser } from "@/services/users.service";
import { LegalEnum } from "@/types";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text } from "react-native";

function SettingsScreen() {
  const handleOnTermsAndConditionsPress = () => {
    router.push({
      pathname: "/legal",
      params: { type: LegalEnum.TERMS_AND_CONDITIONS },
    });
  };

  const handleOnPrivacyPolicyPress = () => {
    router.push({
      pathname: "/legal",
      params: { type: LegalEnum.PRIVACY_POLICY },
    });
  };

  const handleOnSendFeedbackPress = () => {
    Alert.alert(
      "Send Feedback",
      "You will be redirected to a webpage to send your feedback. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => {
            Linking.openURL("https://nativ.codes/#contact");
          },
        },
      ]
    );
  };

  const logOut = async () => {
    try {
      await signOut();
      router.replace("/");
      clearAllData();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleOnRemoveAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser();
            } catch (error) {
              console.error("Error deleting user:", error);
            } finally {
              logOut();
            }
          },
        },
      ]
    );
  };

  const handleOnLogOut = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: logOut,
      },
    ]);
  };

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={
            <Text style={GeneralStyles.textTitleScreenPrimary}>Settings</Text>
          }
        />
      </Spacer>
      <Spacer direction="horizontal" size="s16" gap="s32">
        <Menu>
          <Menu.Item
            onPress={noop}
            label="Manage main tags"
            right={
              <Text style={GeneralStyles.textLabelMediumSecondary}>Soon</Text>
            }
          />
          <Menu.Item
            onPress={noop}
            label="Publish your list"
            right={
              <Text style={GeneralStyles.textLabelMediumSecondary}>Soon</Text>
            }
          />
        </Menu>
        <Menu>
          <Menu.Item
            onPress={handleOnTermsAndConditionsPress}
            label="Terms and Conditions"
          />
          <Menu.Item
            onPress={handleOnPrivacyPolicyPress}
            label="Privacy Policy"
          />
          <Menu.Item onPress={handleOnSendFeedbackPress} label="Send us your feedback" />
        </Menu>
        <Menu>
          <Menu.Item
            onPress={handleOnRemoveAccount}
            label="Remove account"
          />
          <Menu.Item onPress={handleOnLogOut} label="Log out" />
        </Menu>
        <Text
          style={StyleSheet.compose(
            GeneralStyles.textLabelMediumSecondary,
            GeneralStyles.textCenter
          )}
        >
          ZaveIT v{Application.nativeApplicationVersion}
        </Text>
      </Spacer>
    </ScreenLayout>
  );
}

export default SettingsScreen;
