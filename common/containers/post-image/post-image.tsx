import { Image } from "expo-image";
import { memo } from "react";
import { useTryThumbnailUrl } from "./post-image.hook";
import { PostImagePropsType } from "./post-image.type";

function PostImage({ id, style }: PostImagePropsType) {
  const { uri, onError } = useTryThumbnailUrl(id);

  return <Image source={{ uri }} style={style} onError={onError} />;
}

export default memo(PostImage);
