import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { updateThumbnail } from "@/common/utils";
import * as FileSystem from "expo-file-system";
import { Image, useImage } from "expo-image";
import { memo, useRef } from "react";
import { PostImagePropsType } from "./post-image.type";

function PostImage({ id, style }: PostImagePropsType) {
  const maxRetries = useRef(0);
  const image = useImage(`${FileSystem.documentDirectory}${id}.jpg`, {
    onError: (_, retry) => {
      console.log("onError", `${FileSystem.documentDirectory}${id}.jpg`, maxRetries.current);
      maxRetries.current++;
      if (maxRetries.current > 3) {
        return;
      }
      updateThumbnail(id).then(retry);
    },
  });

  return (
    <Image
      source={image}
      placeholder={IMAGE_PLACEHOLDER}
      placeholderContentFit="cover"
      style={style}
    />
  );
}

export default memo(PostImage);
