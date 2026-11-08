import { Button, Menu, TopBar } from "@/common/components";
import { Colors } from "@/common/constants";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  createList,
  HOST,
  isValidListPassword,
  isValidSlug,
  LIST_NAME_DISALLOWED,
  toListPath,
} from "@/services/lists.service";
import * as Burnt from "burnt";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import styles, { PRIMARY_SWITCH_TRACK } from "./publish.style";
import TagRow from "./tag-row";

const WEAK_HINT = "Anyone with the link and this password can see the List. A simple password is easy to guess.";

function NewListScreen() {
  const { username, listPaths = "" } = useLocalSearchParams<{ username: string; listPaths?: string }>();

  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [published, setPublished] = useState(true);
  const [takenPaths, setTakenPaths] = useState(() => listPaths.split(",").filter(Boolean));
  const [isSaving, setIsSaving] = useState(false);

  const listPath = toListPath(name);
  const isPathValid = isValidSlug(listPath);
  const isPathTaken = takenPaths.includes(listPath);
  const isPasswordValid = isValidListPassword(password);

  const pathHint = () => {
    if (isPathTaken) return "You already have a List with this link. Pick another name.";
    if (name && !isPathValid) return "The link needs 3 to 30 letters or digits.";
    return "Made from the name. Renaming the List changes it.";
  };

  const handleOnSave = async () => {
    setIsSaving(true);
    try {
      const list = await createList({ name: name.trim(), tags, password, published });
      if (!list) {
        setTakenPaths((paths) => [...paths, listPath]);
        return;
      }
      router.replace({ pathname: "/manage-list", params: { listPath: list.listPath, name: list.name, username } });
    } catch {
      Burnt.toast({ title: "Couldn't save the List. Try again.", preset: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <TopBar hasBackButton />
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Text style={GeneralStyles.textTitleScreenPrimary}>New list</Text>
        <Spacer gap="s8">
          <Text style={GeneralStyles.textLabelLargePrimary}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => setName(text.replace(LIST_NAME_DISALLOWED, ""))}
            placeholder="e.g. Weeknight recipes"
            placeholderTextColor={Colors.text.placeholder}
            autoCapitalize="sentences"
            autoCorrect={false}
            maxLength={50}
            accessibilityLabel="Name"
          />
        </Spacer>
        <Spacer gap="s8">
          <Text style={GeneralStyles.textLabelLargePrimary}>Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText}>
              {HOST}
              {username}/<Text style={listPath ? styles.linkPath : styles.linkPlaceholder}>{listPath || "list-name"}</Text>
            </Text>
          </View>
          <Text style={[GeneralStyles.textLabelMediumSecondary, (isPathTaken || (name && !isPathValid)) && styles.error]}>
            {pathHint()}
          </Text>
        </Spacer>
        <Spacer gap="s8">
          <Text style={GeneralStyles.textLabelLargePrimary}>Tags</Text>
          <TagRow selected={tags} onChange={setTags} />
        </Spacer>
        <Spacer gap="s8">
          <Text style={GeneralStyles.textLabelLargePrimary}>List Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 3 characters"
            placeholderTextColor={Colors.text.placeholder}
            secureTextEntry
            // oneTimeCode stops iOS offering to save this shared List password to the keychain.
            textContentType="oneTimeCode"
            autoComplete="off"
            importantForAutofill="no"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={128}
            accessibilityLabel="List Password"
          />
          <Text style={GeneralStyles.textLabelMediumSecondary}>{WEAK_HINT}</Text>
        </Spacer>
        <Menu>
          <Menu.Item
            label="Published"
            description={published ? "Goes online when you save" : "Saved offline. Turn it on later."}
            onPress={() => setPublished(!published)}
            accessibilityValue={{ text: published ? "On" : "Off" }}
            right={
              <Switch
                value={published}
                thumbColor={Colors.white}
                trackColor={PRIMARY_SWITCH_TRACK}
                onValueChange={setPublished}
              />
            }
          />
        </Menu>
        <Button
          type="primary"
          label="Save"
          isDisabled={!isPathValid || isPathTaken || tags.length === 0 || !isPasswordValid}
          isLoading={isSaving}
          onPress={handleOnSave}
        />
      </Spacer>
    </ScreenLayout>
  );
}

export default NewListScreen;
