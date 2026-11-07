import { Button, TagItem, TopBar } from "@/common/components";
import { Colors, Units } from "@/common/constants";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import {
  claimUsername,
  getLists,
  HOST,
  isUsernameAvailable,
  isValidSlug,
  List,
  ListsResponse,
  MAX_LISTS,
  updateList,
} from "@/services/lists.service";
import { LegalEnum } from "@/types";
import Icon from "@expo/vector-icons/Feather";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { confirmOffline } from "./manage-list";
import styles, { PRIMARY_SWITCH_TRACK } from "./publish.style";

const CHECK_DELAY_MS = 500;

type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken" | "error";

const STATUS_TEXT: Record<UsernameStatus, string> = {
  idle: "3 to 30 letters, digits or hyphens",
  invalid: "Use 3 to 30 lowercase letters, digits and single hyphens",
  checking: "Checking...",
  available: "Available",
  taken: "Taken",
  error: "Couldn't check. Try again.",
};

function useUsernameStatus(username: string) {
  const [status, setStatus] = useState<UsernameStatus>("idle");

  useEffect(() => {
    if (!username) {
      setStatus("idle");
      return;
    }
    if (!isValidSlug(username)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    let isCurrent = true;
    const timeout = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);
        if (isCurrent) setStatus(available ? "available" : "taken");
      } catch {
        if (isCurrent) setStatus("error");
      }
    }, CHECK_DELAY_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [username]);

  return { status, setStatus };
}

function PublishScreen() {
  const [account, setAccount] = useState<ListsResponse>();
  const [hasLoadError, setHasLoadError] = useState(false);
  const [username, setUsername] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const { status, setStatus } = useUsernameStatus(username);

  const load = useCallback(async () => {
    setHasLoadError(false);
    try {
      setAccount(await getLists());
    } catch {
      setHasLoadError(true);
    }
  }, []);

  // Reloads when the user comes back from a new or changed List.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleOnUsernameChange = (text: string) => {
    setUsername(text.toLowerCase().replace(/\s/g, ""));
  };

  const handleOnClaim = async () => {
    setIsClaiming(true);
    try {
      if (await claimUsername(username)) {
        setAccount({ username, lists: [] });
      } else {
        // 409: someone else got it first, or this user already has one, which the reload shows.
        setStatus("taken");
        await load();
      }
    } catch {
      Burnt.toast({ title: "Couldn't claim the Username. Try again.", preset: "error" });
    } finally {
      setIsClaiming(false);
    }
  };

  const renderClaim = () => (
    <>
      <Text style={GeneralStyles.textLabelLargeSecondary}>
        First, claim your Username. Every List you publish lives under it.
      </Text>
      <Spacer gap="s8">
        <Spacer style={styles.usernameField}>
          <Text style={styles.usernamePrefix}>{HOST}</Text>
          <TextInput
            style={styles.usernameInput}
            value={username}
            onChangeText={handleOnUsernameChange}
            placeholder="your-name"
            placeholderTextColor={Colors.text.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            accessibilityLabel="Username"
          />
        </Spacer>
        <Text
          style={[
            GeneralStyles.textLabelMediumSecondary,
            status === "available" && styles.available,
            (status === "invalid" || status === "taken" || status === "error") && styles.error,
          ]}
        >
          {STATUS_TEXT[status]}
        </Text>
        <Text style={GeneralStyles.textLabelMediumSecondary}>
          Your Username is the start of every List link and can&apos;t be changed.
        </Text>
      </Spacer>
      <Button
        type="primary"
        label="Claim"
        isDisabled={status !== "available"}
        isLoading={isClaiming}
        onPress={handleOnClaim}
      />
    </>
  );

  const openList = (list: List) =>
    router.push({ pathname: "/manage-list", params: { listPath: list.listPath, name: list.name, username: account?.username } });

  const copyLink = async (list: List) => {
    await Clipboard.setStringAsync(`https://${HOST}${account?.username}/${list.listPath}`);
    Burnt.toast({ title: "Link copied", preset: "done" });
  };

  const setPublished = async (list: List, published: boolean) => {
    try {
      await updateList(list.listPath, { published });
    } catch {
      Burnt.toast({ title: "Couldn't update the List. Try again.", preset: "error" });
    }
    await load();
  };

  const renderCard = (list: List) => (
    <TouchableOpacity key={list.listPath} style={styles.card} onPress={() => openList(list)} activeOpacity={0.7}>
      <View style={styles.cardHead}>
        <Text style={[GeneralStyles.textLabelLargePrimary, GeneralStyles.flex]} numberOfLines={1}>
          {list.name}
        </Text>
        <Switch
          value={list.published}
          thumbColor={Colors.white}
          trackColor={PRIMARY_SWITCH_TRACK}
          onValueChange={(published) => (published ? setPublished(list, true) : confirmOffline(() => setPublished(list, false)))}
          accessibilityLabel={`Published ${list.name}`}
        />
      </View>
      <TouchableOpacity
        style={styles.copyRow}
        hitSlop={Units.s8}
        onPress={() => copyLink(list)}
        accessibilityLabel="Copy link"
      >
        <Text style={styles.smallLink} numberOfLines={1}>
          /{account?.username}/{list.listPath}
        </Text>
        <Icon name="copy" size={Units.s16} color={Colors.text.secondary} />
      </TouchableOpacity>
      <View style={styles.tags}>
        {list.tags.map((tag) => (
          <TagItem key={tag} tag={tag} size="small" isReadOnly />
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderLists = (lists: List[]) => (
    <>
      {lists.map(renderCard)}
      {lists.length === 0 && (
        <Text style={GeneralStyles.textLabelMediumSecondary}>No Lists yet. Make one to put it on the web.</Text>
      )}
      <Button
        type="primary"
        label="New list"
        isDisabled={lists.length >= MAX_LISTS}
        onPress={() =>
          router.push({
            pathname: "/new-list",
            params: { username: account?.username, listPaths: lists.map((l) => l.listPath).join(",") },
          })
        }
      />
      <Text style={GeneralStyles.textLabelMediumSecondary}>
        {lists.length} of {MAX_LISTS} Lists
      </Text>
    </>
  );

  const renderBody = () => {
    if (hasLoadError) {
      return (
        <>
          <Text style={[GeneralStyles.textLabelMediumSecondary, styles.error]}>
            Couldn&apos;t load. Check your connection.
          </Text>
          <Button type="ghost" label="Try again" onPress={load} />
        </>
      );
    }
    if (!account) {
      return <ActivityIndicator color={Colors.primary} />;
    }
    return account.username ? renderLists(account.lists) : renderClaim();
  };

  return (
    <ScreenLayout>
      <TopBar hasBackButton />
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Text style={GeneralStyles.textTitleScreenPrimary}>Publish your list</Text>
        <Text style={GeneralStyles.textLabelLargeSecondary}>
          Publishing puts a List of your saved posts on a web page. You pick which Tags go in each List and give it a
          password. Visitors with the link and the password can only look and search. See the{" "}
          <Text
            style={GeneralStyles.textLink}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: "/legal", params: { type: LegalEnum.TERMS_AND_CONDITIONS } })}
          >
            Terms
          </Text>
          .
        </Text>
        {renderBody()}
      </Spacer>
    </ScreenLayout>
  );
}

export default PublishScreen;
