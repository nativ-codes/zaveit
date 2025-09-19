import { Button } from "@/common/components";
import { ACTIVE_OPACITY_NO_FEEDBACK, Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { noop, safelyPrintError } from "@/common/utils";
import { ErrorHandler } from "@/config/errors";
import SearchInput from "@/screens/search/components/search-input/search-input";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./add-post-modal.style";
import { AddPostModalPropsType } from "./add-post-modal.type";

function AddPostModal({ isVisible, onClose, onSubmit }: AddPostModalPropsType) {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState("");

  const handleOnPaste = async () => {
    const text = await Clipboard.getStringAsync();
    setUrl(text);
  };

  const handleOnClear = () => {
    setUrl("");
  };

  const onAction = url.length ? handleOnClear : handleOnPaste;
  const actionIcon = url.length ? "x" : "clipboard";

  const handleOnClose = () => {
    setUrl("");
    onClose();
  };

  const handleOnZavePost = () => {
    try {
      const trimmedUrl = url.trim();
      new URL(trimmedUrl);

      if (trimmedUrl) {
        onSubmit(trimmedUrl);
        handleOnClose();
      }
    } catch (error) {
      ErrorHandler.logError({
        location: "handleOnZavePost",
        error: safelyPrintError(error),
        metadata: {
          url,
        },
      });
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleOnClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={ACTIVE_OPACITY_NO_FEEDBACK}
        onPress={handleOnClose}
      >
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY_NO_FEEDBACK}
          onPress={noop}
        >
          <Spacer
            gap="s24"
            size="s24"
            direction="full"
            style={StyleSheet.compose(styles.container, {
              marginBottom: insets.bottom || Units.s16,
            })}
          >
            <Text style={GeneralStyles.textTitlePostMediumPrimary}>
              Add New Post
            </Text>

            <SearchInput
              value={url}
              isActionVisible
              placeholder="Enter or paste URL..."
              onChangeText={setUrl}
              onAction={onAction}
              actionIcon={actionIcon}
            />

            <View style={styles.buttonContainer}>
              <Button
                label="Zave post"
                type="primary"
                onPress={handleOnZavePost}
              />
            </View>
          </Spacer>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default AddPostModal;
