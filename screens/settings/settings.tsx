import { Menu, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { noop } from "@/common/utils";
import { LegalEnum } from "@/types";
import * as Application from "expo-application";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native";

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
            label="Add main tags"
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
          <Menu.Item onPress={() => {}} label="Send us your feedback" />
        </Menu>
        <Menu>
          <Menu.Item onPress={() => {}} label="Remove all data" />
          <Menu.Item onPress={() => {}} label="Log out" />
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
