import { Menu, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { setAppAuthType } from "@/config/storage/auth";
import {
  clearAllData,
  removeDuplicatePosts,
} from "@/config/storage/persistent";
import React from "react";
import { Text } from "react-native";

function DebugScreen() {
  const handleOnAuthType = () => {
    setAppAuthType();
  };

  const handleOnGoogleAuthType = () => {
    setAppAuthType("google");
  };

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={GeneralStyles.textTitleScreenPrimary}>Debug</Text>}
        />
      </Spacer>
      <Spacer direction="horizontal" size="s16" gap="s32">
        <Menu>
          <Menu.Item onPress={clearAllData} label="Clear all data" />
          <Menu.Item onPress={removeDuplicatePosts} label="Remove duplicate posts" />
          <Menu.Item onPress={handleOnAuthType} label="Reset appAuthType" />
          <Menu.Item
            onPress={handleOnGoogleAuthType}
            label="Google appAuthType"
          />
        </Menu>
      </Spacer>
    </ScreenLayout>
  );
}

export default DebugScreen;
