import { TopBar } from "@/common/components";
import { Spacer, TabLayout } from "@/common/layouts";
import React from "react";
import { Text } from "react-native";
import styles from "./settings.style";

function SettingsScreen() {
  return (
    <TabLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar left={<Text style={styles.title}>Settings</Text>} />
      </Spacer>
    </TabLayout>
  );
}

export default SettingsScreen;
