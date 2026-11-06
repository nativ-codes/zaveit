import { Button, SheetModal } from "@/common/components";
import { getDomainFromUrl } from "@/common/utils/formatters";
import React from "react";

type PendingPostModalPropsType = {
  url?: string;
  onSave: () => void;
  onDiscard: () => void;
};

function PendingPostModal({ url, onSave, onDiscard }: PendingPostModalPropsType) {
  // Unmounted rather than hidden, so the fade-out never shows an empty link.
  if (!url) {
    return null;
  }

  return (
    <SheetModal
      isVisible
      onRequestClose={onDiscard}
      title={`Save the link from ${getDomainFromUrl(url)}?`}
      body={`You shared this before signing in: ${url}`}
      buttons={
        <>
          <SheetModal.SecondaryButtonWrapper>
            <Button label="Discard" type="ghost" onPress={onDiscard} />
          </SheetModal.SecondaryButtonWrapper>
          <Button label="Save" type="primary" onPress={onSave} />
        </>
      }
    />
  );
}

export default PendingPostModal;
