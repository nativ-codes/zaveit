import { SpinningLoader } from "@/common/components";
import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { saveImageFromUrl } from "@/common/utils/files";
import { forceHttps } from "@/common/utils/formatters";
import { markImageFailed } from "@/config/storage/posts";
import { storage } from "@/config/storage/storage";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { PostImagePropsType } from "./post-image.type";

type Status = "loading" | "done" | "failed";

// Tracks in-progress downloads. Secondary instances for the same id await the
// primary's promise instead of firing a duplicate network request.
const downloadPromises = new Map<string, Promise<void>>();

function PostImage({ id, url, style }: PostImagePropsType) {
  const [status, setStatus] = useState<Status>("loading");
  const [imageStatusRaw] = useMMKVString(`imageStatus.${id}`, storage);
  const [imageReloadAt] = useMMKVString(`imageReloadAt.${id}`, storage);

  useEffect(() => {
    if (imageStatusRaw === "failed") {
      setStatus("failed");
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      const localUri = `${FileSystem.documentDirectory}${id}.jpg`;
      const info = await FileSystem.getInfoAsync(localUri);

      if (cancelled) return;

      if (info.exists && !imageReloadAt) {
        setStatus("done");
        return;
      }

      if (!url) {
        storage.delete(`imageReloadAt.${id}`);
        markImageFailed(id);
        setStatus("failed");
        return;
      }

      setStatus("loading");

      const existingPromise = downloadPromises.get(id);
      if (existingPromise) {
        // Another instance is already downloading this image — wait for it.
        await existingPromise;
        if (cancelled) return;
        const info2 = await FileSystem.getInfoAsync(localUri);
        if (!cancelled) {
          if (info2.exists) {
            setStatus("done");
          } else {
            markImageFailed(id);
            setStatus("failed");
          }
        }
        return;
      }

      let resolveDownload!: () => void;
      const promise = new Promise<void>(resolve => { resolveDownload = resolve; });
      downloadPromises.set(id, promise);

      try {
        const metadata = await getMetadata({ webUrl: url });

        if (!metadata.thumbnail) {
          if (!cancelled) { storage.delete(`imageReloadAt.${id}`); markImageFailed(id); setStatus("failed"); }
          return;
        }

        const savedUri = await saveImageFromUrl(forceHttps(metadata.thumbnail), id);

        if (!cancelled) {
          storage.delete(`imageReloadAt.${id}`);
          if (savedUri) {
            setStatus("done");
          } else {
            markImageFailed(id);
            setStatus("failed");
          }
        }
      } catch {
        if (!cancelled) {
          storage.delete(`imageReloadAt.${id}`);
          markImageFailed(id);
          setStatus("failed");
        }
      } finally {
        resolveDownload();
        downloadPromises.delete(id);
      }
    };

    loadImage();
    return () => {
      cancelled = true;
    };
  }, [id, url, imageStatusRaw, imageReloadAt]);

  if (status === "loading") {
    return (
      <View
        style={[
          style,
          { justifyContent: "center", alignItems: "center", backgroundColor: Colors.skeleton },
        ]}
      >
        <SpinningLoader size="small" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: `${FileSystem.documentDirectory}${id}.jpg` }}
      recyclingKey={`${id}-${imageStatusRaw ?? "ok"}-${imageReloadAt ?? ""}`}
      placeholder={IMAGE_PLACEHOLDER}
      placeholderContentFit="cover"
      contentFit="cover"
      style={style}
    />
  );
}

export default memo(PostImage);
