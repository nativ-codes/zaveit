import { Button, SheetModal } from "@/common/components";
import { getDomainFromUrl } from "@/common/utils/formatters";
import React from "react";

type SignInToSaveModalPropsType = {
  url?: string;
  onClose: () => void;
};

function SignInToSaveModal({ url, onClose }: SignInToSaveModalPropsType) {
  // Unmounted rather than hidden, so the fade-out never shows an empty link.
  if (!url) {
    return null;
  }

  return (
    <SheetModal
      isVisible
      onRequestClose={onClose}
      title={`Sign in to save the link from ${getDomainFromUrl(url)}`}
      body="ZaveIt needs an account to save posts. Your link is kept, and you can save it right after you sign in."
      buttons={<Button label="Got it" type="primary" onPress={onClose} />}
    />
  );
}

export default SignInToSaveModal;
