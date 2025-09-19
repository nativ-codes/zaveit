import { Menu, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { deleteAllImages } from "@/common/utils/files";
import {
  clearAllData,
  removeDuplicatePosts,
  setAppAuthType,
} from "@/config/storage";
import { storage } from "@/config/storage/storage";
import React, { useState } from "react";
import { Text } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { v4 as uuid } from "uuid";
import { getDefaultMappings } from "./debug.util";

function DebugScreen() {
  const [name, setName] = useMMKVString("name", storage);
  const [mappings, setMappings] = useState(getDefaultMappings());

  const handleOnNameChange = () => {
    setName(Math.random().toString());
  };

  const handleOnAuthType = () => {
    setAppAuthType();
  };

  const handleOnGoogleAuthType = () => {
    setAppAuthType("google");
  };

  const handleOnAppleAuthType = () => {
    setAppAuthType("apple");
  };

  const handleOnAddMapping = () => {
    const id = uuid();
    const key = `mappings.${id}`;
    storage.set(key, id);
    setMappings([key, ...mappings]);
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
          <Menu.Item onPress={handleOnNameChange} label={`Random: ${name}`} />
          <Menu.Item onPress={clearAllData} label="Clear all data" />
          <Menu.Item onPress={deleteAllImages} label="Delete all images" />
          <Menu.Item
            onPress={removeDuplicatePosts}
            label="Remove duplicate posts"
          />
          <Menu.Item onPress={handleOnAuthType} label="Reset appAuthType" />
          <Menu.Item
            onPress={handleOnGoogleAuthType}
            label="Google appAuthType"
          />
          <Menu.Item
            onPress={handleOnAppleAuthType}
            label="Apple appAuthType"
          />
        </Menu>
        <Menu>
          <Spacer direction={["left", "bottom"]} size="s8">
            <Text style={GeneralStyles.textLabelMediumSecondary}>
              MMKV Playground
            </Text>
          </Spacer>
          <Menu.Item onPress={handleOnAddMapping} label="Add mapping" />
          <Text>Mappings:</Text>
          <Spacer direction="left" size="s16">
            {mappings.map((value: string) => (
              <Text key={value}>- {value}</Text>
            ))}
          </Spacer>
        </Menu>
      </Spacer>
    </ScreenLayout>
  );
}

export default DebugScreen;
