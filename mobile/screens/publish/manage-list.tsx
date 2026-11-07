import { Button, Menu, SheetModal, TopBar } from "@/common/components";
import { Colors, Units } from "@/common/constants";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  deleteList,
  getLists,
  HOST,
  isValidListPassword,
  isValidSlug,
  List,
  LIST_NAME_DISALLOWED,
  toListPath,
  updateList,
} from "@/services/lists.service";
import Icon from "@expo/vector-icons/Feather";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Share, Switch, Text, TextInput, View } from "react-native";
import styles, { PRIMARY_SWITCH_TRACK } from "./publish.style";
import TagRow from "./tag-row";

// Also used by the Publish screen's card switch.
export const confirmOffline = (onYes: () => void) =>
  Alert.alert(
    "Take this List offline?",
    "Visitors see the password prompt as if the List didn't exist. Everything is kept and you can turn it back on.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Take offline", style: "destructive", onPress: onYes },
    ]
  );

type Sheet = "tags" | "name" | "password" | null;

function ManageListScreen() {
  const params = useLocalSearchParams<{ listPath: string; name: string; username: string }>();
  const { username } = params;
  const [list, setList] = useState<List>();
  const [takenPaths, setTakenPaths] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getLists()
      .then(({ lists }) => {
        setList(lists.find((l) => l.listPath === params.listPath));
        setTakenPaths(lists.map((l) => l.listPath).filter((p) => p !== params.listPath));
      })
      .catch(() => Burnt.toast({ title: "Couldn't load the List. Try again.", preset: "error" }));
  }, [params.listPath]);

  const url = list ? `https://${HOST}${username}/${list.listPath}` : "";
  const newPath = toListPath(name);
  const isNewPathValid = isValidSlug(newPath);
  const isNewPathTaken = takenPaths.includes(newPath);

  const save = async (changes: Parameters<typeof updateList>[1], done?: string) => {
    if (!list) return;
    setIsSaving(true);
    try {
      const updated = await updateList(list.listPath, changes);
      if (!updated) {
        // 409: only a rename can clash.
        setTakenPaths((paths) => [...paths, toListPath(changes.name ?? "")]);
        return;
      }
      setList(updated);
      // iOS offers to save a filled secure field when it leaves the screen; oneTimeCode alone doesn't stop it.
      setPassword("");
      setSheet(null);
      if (done) Burnt.toast({ title: done, preset: "done" });
    } catch {
      Burnt.toast({ title: "Couldn't save the List. Try again.", preset: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!list) {
    return (
      <ScreenLayout>
        <TopBar hasBackButton />
        <Spacer direction="horizontal" size="s16" gap="s16">
          <Text style={GeneralStyles.textTitleScreenPrimary}>{params.name}</Text>
          <ActivityIndicator color={Colors.primary} />
        </Spacer>
      </ScreenLayout>
    );
  }

  const share = () => Share.share({ message: url });
  const copy = async () => {
    await Clipboard.setStringAsync(url);
    Burnt.toast({ title: "Link copied", preset: "done" });
  };
  const setPublished = (published: boolean) =>
    published ? save({ published }) : confirmOffline(() => save({ published }));
  const confirmDelete = () =>
    Alert.alert(
      `Delete "${list.name}"?`,
      `The page goes away and /${list.listPath} becomes free again. Your Posts are not deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete list",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteList(list.listPath);
              router.back();
            } catch {
              Burnt.toast({ title: "Couldn't delete the List. Try again.", preset: "error" });
            }
          },
        },
      ]
    );

  const close = () => setSheet(null);
  const cancel = (
    <SheetModal.SecondaryButtonWrapper>
      <Button type="ghost" label="Cancel" onPress={close} />
    </SheetModal.SecondaryButtonWrapper>
  );
  const pathChanges = newPath !== list.listPath;

  return (
    <ScreenLayout>
      <TopBar hasBackButton />
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Text style={GeneralStyles.textTitleScreenPrimary}>{list.name}</Text>
        <Menu>
          <Menu.Item
            label="Published"
            description={list.published ? "Your page is online" : "Your page is offline"}
            onPress={() => setPublished(!list.published)}
            accessibilityValue={{ text: list.published ? "On" : "Off" }}
            right={
              <Switch
                value={list.published}
                thumbColor={Colors.white}
                trackColor={PRIMARY_SWITCH_TRACK}
                onValueChange={setPublished}
              />
            }
          />
        </Menu>
        <Menu>
          <Menu.Item
            label={`${HOST}${username}/${list.listPath}`}
            onPress={copy}
            right={<Icon name="copy" size={Units.s20} color={Colors.text.secondary} />}
          />
          <Menu.Item
            label="Open link"
            onPress={() => Linking.openURL(url)}
            right={<Icon name="external-link" size={Units.s20} color={Colors.text.secondary} />}
          />
          <Menu.Item label="Share link" onPress={share} />
        </Menu>
        <Menu>
          <Menu.Item
            label="Tags"
            description={list.tags.map((tag) => `#${tag}`).join(" ")}
            onPress={() => {
              setTags(list.tags);
              setSheet("tags");
            }}
          />
          <Menu.Item
            label="Name"
            description={list.name}
            onPress={() => {
              setName(list.name);
              setSheet("name");
            }}
          />
          <Menu.Item
            label="Change List Password"
            onPress={() => {
              setPassword("");
              setSheet("password");
            }}
          />
        </Menu>
        <Menu>
          <Menu.Item label="Delete list" onPress={confirmDelete} />
        </Menu>
      </Spacer>

      <SheetModal
        isVisible={sheet === "tags"}
        onRequestClose={close}
        title="Change Tags"
        body="Posts with any of these Tags are in the List, now and later."
        buttons={
          <>
            {cancel}
            <Button
              type="primary"
              label="Save"
              isDisabled={tags.length === 0}
              isLoading={isSaving}
              onPress={() => save({ tags })}
            />
          </>
        }
      >
        <TagRow selected={tags} onChange={setTags} />
      </SheetModal>
      <SheetModal
        isVisible={sheet === "name"}
        onRequestClose={close}
        title="Change name"
        body={
          pathChanges
            ? "The link changes with the name. The old link stops working, so share the new one again."
            : "The link stays the same."
        }
        buttons={
          <>
            {cancel}
            <Button
              type="primary"
              label="Save"
              isDisabled={!isNewPathValid || isNewPathTaken || name.trim() === list.name}
              isLoading={isSaving}
              onPress={() => save({ name: name.trim() })}
            />
          </>
        }
      >
        <Spacer gap="s8">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => setName(text.replace(LIST_NAME_DISALLOWED, ""))}
            placeholder="List name"
            placeholderTextColor={Colors.text.placeholder}
            autoCapitalize="sentences"
            autoCorrect={false}
            maxLength={50}
            accessibilityLabel="Name"
          />
          <View style={styles.linkBox}>
            <Text style={styles.linkText}>
              {HOST}
              {username}/<Text style={newPath ? styles.linkPath : styles.linkPlaceholder}>{newPath || "list-name"}</Text>
            </Text>
          </View>
          {isNewPathTaken && (
            <Text style={[GeneralStyles.textLabelMediumSecondary, styles.error]}>
              You already have a List with this link. Pick another name.
            </Text>
          )}
          {name !== "" && !isNewPathValid && (
            <Text style={[GeneralStyles.textLabelMediumSecondary, styles.error]}>
              The link needs 3 to 30 letters or digits.
            </Text>
          )}
        </Spacer>
      </SheetModal>
      <SheetModal
        isVisible={sheet === "password"}
        onRequestClose={close}
        title="Change List Password"
        body="Everyone who has the old password, including you in open tabs, will need the new one."
        buttons={
          <>
            {cancel}
            <Button
              type="primary"
              label="Save"
              isDisabled={!isValidListPassword(password)}
              isLoading={isSaving}
              onPress={() => save({ password }, "Password changed")}
            />
          </>
        }
      >
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor={Colors.text.placeholder}
          secureTextEntry
          // oneTimeCode keeps iOS from offering to save the List Password to the keychain.
          textContentType="oneTimeCode"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
          accessibilityLabel="New List Password"
        />
      </SheetModal>
    </ScreenLayout>
  );
}

export default ManageListScreen;
