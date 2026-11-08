import { IMAGE_PLACEHOLDER } from "@/common/constants";
import { Image } from "expo-image";
import { memo } from "react";
import { PostImagePropsType } from "./post-image.type";

// expo-image keeps the R2 file in its disk cache; Posts without a Thumbnail show the placeholder.
function PostImage({ thumbnailUrl, style, onError }: PostImagePropsType) {
  return (
    <Image
      source={thumbnailUrl ?? IMAGE_PLACEHOLDER}
      recyclingKey={thumbnailUrl}
      placeholder={IMAGE_PLACEHOLDER}
      placeholderContentFit="cover"
      contentFit="cover"
      style={style}
      onError={onError}
    />
  );
}

export default memo(PostImage);
