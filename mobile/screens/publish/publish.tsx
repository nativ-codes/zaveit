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
import Icon from "@expo/vector-icons/Feather";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { confirmOffline } from "./manage-list";
import styles, { PRIMARY_SWITCH_TRACK } from "./publish.style";

const CHECK_DELAY_MS = 500;
const EXAMPLE_TAGS = ["books", "articles", "essays"];

type UsernameStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

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
  const [isClaimVisible, setIsClaimVisible] = useState(false);
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
    }, [load]),
  );

  const handleOnUsernameChange = (text: string) => {
    setUsername(text.toLowerCase().replace(/\s/g, ""));
  };

  const handleOnClaim = async () => {
    setIsClaiming(true);
    try {
      if (await claimUsername(username)) {
        setAccount({ username, lists: [] });
        openNewList(username, []);
      } else {
        // 409: someone else got it first, or this user already has one, which the reload shows.
        setStatus("taken");
        await load();
      }
    } catch {
      Burnt.toast({
        title: "Couldn't claim the Username. Try again.",
        preset: "error",
      });
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
            (status === "invalid" ||
              status === "taken" ||
              status === "error") &&
              styles.error,
          ]}
        >
          {STATUS_TEXT[status]}
        </Text>
        <Text style={GeneralStyles.textLabelMediumSecondary}>
          Your Username is the start of every List link and can&apos;t be
          changed.
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

  const openNewList = (owner: string | null | undefined, lists: List[]) =>
    router.push({
      pathname: "/new-list",
      params: {
        username: owner,
        listPaths: lists.map((l) => l.listPath).join(","),
      },
    });

  const openList = (list: List) =>
    router.push({
      pathname: "/manage-list",
      params: {
        listPath: list.listPath,
        name: list.name,
        username: account?.username,
      },
    });

  const copyLink = async (list: List) => {
    await Clipboard.setStringAsync(
      `https://${HOST}${account?.username}/${list.listPath}`,
    );
    Burnt.toast({ title: "Link copied", preset: "done" });
  };

  const setPublished = async (list: List, published: boolean) => {
    try {
      await updateList(list.listPath, { published });
    } catch {
      Burnt.toast({
        title: "Couldn't update the List. Try again.",
        preset: "error",
      });
    }
    await load();
  };

  const renderCard = (list: List) => (
    <TouchableOpacity
      key={list.listPath}
      style={styles.card}
      onPress={() => openList(list)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHead}>
        <Text
          style={[GeneralStyles.textTitleSectionPrimary, GeneralStyles.flex]}
          numberOfLines={1}
        >
          {list.name}
        </Text>
        <Switch
          value={list.published}
          thumbColor={Colors.white}
          trackColor={PRIMARY_SWITCH_TRACK}
          onValueChange={(published) =>
            published
              ? setPublished(list, true)
              : confirmOffline(() => setPublished(list, false))
          }
          accessibilityLabel={`Published ${list.name}`}
        />
      </View>
      <TouchableOpacity
        style={styles.copyRow}
        hitSlop={Units.s8}
        onPress={() => copyLink(list)}
        accessibilityLabel="Copy link"
      >
        <Text
          style={[GeneralStyles.textLabelLargeSecondary, styles.smallLink]}
          numberOfLines={1}
        >
          {HOST}
          <Text style={styles.smallLinkPath}>
            {account?.username}/{list.listPath}
          </Text>
        </Text>
        <Icon name="copy" size={Units.s16} color={Colors.text.secondary} />
      </TouchableOpacity>
      <View style={styles.tags}>
        {list.tags.map((tag) => (
          <TagItem key={tag} tag={tag} size="medium" isReadOnly />
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderLists = (lists: List[]) => (
    <>
      {lists.map(renderCard)}
      <Button
        type="primary"
        label="Add new list"
        isDisabled={lists.length >= MAX_LISTS}
        onPress={() => openNewList(account?.username, lists)}
      />
      <Text
        style={[
          GeneralStyles.textLabelMediumSecondary,
          GeneralStyles.textCenter,
        ]}
      >
        {lists.length} of {MAX_LISTS} Lists
      </Text>
    </>
  );

  // A faded example of a published List card, so the empty state shows what the user will get.
  const renderEmpty = () => (
    <>
      <Spacer gap="s8">
        <Text style={GeneralStyles.textTitleSectionPrimary}>
          Share your saves with a link
        </Text>
        <Text style={GeneralStyles.textLabelLargeSecondary}>
          Pick some Tags, get a link. Anyone can open it, no app needed.
        </Text>
      </Spacer>
      <View style={styles.exampleCard} accessibilityLabel="Example List">
        <View style={styles.cardHead}>
          <Text
            style={[
              GeneralStyles.textTitleSectionPrimary,
              GeneralStyles.flex,
              styles.faded,
            ]}
          >
            My reading list
          </Text>
          <View style={styles.exampleSwitch}>
            <View style={styles.exampleThumb} />
          </View>
        </View>
        <Text
          style={[GeneralStyles.textLabelLargeSecondary, styles.faded]}
          numberOfLines={1}
        >
          {HOST}
          <Text style={styles.smallLinkPath}>
            {account?.username || "your-name"}/my-reading-list
          </Text>
        </Text>
        <View style={[styles.tags, styles.faded]}>
          {EXAMPLE_TAGS.map((tag) => (
            <TagItem key={tag} tag={tag} size="medium" isReadOnly />
          ))}
        </View>
        <View style={styles.exampleBadge}>
          <Text style={styles.exampleBadgeText}>EXAMPLE</Text>
        </View>
      </View>
      <Button
        type="primary"
        label="Create your first list"
        onPress={() =>
          account?.username
            ? openNewList(account.username, [])
            : setIsClaimVisible(true)
        }
      />
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
    if (account.username && account.lists.length > 0) {
      return renderLists(account.lists);
    }
    if (!account.username && isClaimVisible) {
      return renderClaim();
    }
    return renderEmpty();
  };

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={
            <Text style={GeneralStyles.textTitleScreenPrimary}>Publish</Text>
          }
        />
      </Spacer>
      <Spacer direction="horizontal" size="s16" gap="s16">
        {renderBody()}
      </Spacer>
    </ScreenLayout>
  );
}

export default PublishScreen;
