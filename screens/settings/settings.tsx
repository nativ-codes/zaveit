import { Menu, TopBar } from "@/common/components";
import { Spacer, TabLayout } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import * as Application from "expo-application";
import React from "react";
import { StyleSheet, Text } from "react-native";

function SettingsScreen() {
  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={GeneralStyles.textTitleScreen}>Settings</Text>}
        />
      </Spacer>
      <Spacer direction="horizontal" size="s16" gap="s32">
        <Menu>
          <Menu.Item onPress={() => {}} label="Terms and Conditions" />
          <Menu.Item onPress={() => {}} label="Privacy Policy" />
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
          ZaveIt v{Application.nativeApplicationVersion}
        </Text>
      </Spacer>
    </TabLayout>
  );
}

export default SettingsScreen;
