import { Menu, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { Analytics } from "@/config/analytics";
import {
  setIsAnalyticsEnabled,
  useIsAnalyticsEnabled,
} from "@/config/storage/persistent";

import React from "react";
import { Switch, Text } from "react-native";

function PreferencesScreen() {
  const isAnalyticsEnabled = useIsAnalyticsEnabled();

  const handleOnShareAnalyticsPress = () => {
    const newIsAnalyticsEnabled = !isAnalyticsEnabled;
    setIsAnalyticsEnabled(newIsAnalyticsEnabled);
    Analytics.sendEvent(Analytics.events.analytics_enabled, {
      isAnalyticsEnabled: newIsAnalyticsEnabled,
    });
  };

  return (
    <ScreenLayout>
      <TopBar hasBackButton />
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Text style={GeneralStyles.textTitleScreenPrimary}>Preferences</Text>
        <Menu>
          <Menu.Item
            onPress={handleOnShareAnalyticsPress}
            label="Share analytics"
            description="We collect anonymous data to improve the app"
            right={
              <Switch
                value={isAnalyticsEnabled}
                onValueChange={handleOnShareAnalyticsPress}
              />
            }
          />
        </Menu>
      </Spacer>
    </ScreenLayout>
  );
}

export default PreferencesScreen;
