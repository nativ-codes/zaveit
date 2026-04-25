import { IMAGE_PLACEHOLDER } from "@/common/constants";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { memo } from "react";
import { PostImagePropsType } from "./post-image.type";

function PostImage({ id, style }: PostImagePropsType) {
  return (
    <Image
      source={{ uri: `${FileSystem.documentDirectory}${id}.jpg` }}
      recyclingKey={id}
      placeholder={IMAGE_PLACEHOLDER}
      placeholderContentFit="cover"
      style={style}
    />
  );
}

export default memo(PostImage);
