import { TopBar } from "@/common/components";
import { Spacer, TabLayout } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { Text } from "react-native";

function SettingsScreen() {
  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={GeneralStyles.textTitleScreen}>Settings</Text>}
        />
      </Spacer>
    </TabLayout>
  );
}

export default SettingsScreen;
