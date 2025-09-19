import { Image } from "expo-image";
import { useTryThumbnailUrl } from "./post-image.hook";
import { PostImagePropsType } from "./post-image.type";

function PostImage({ id, style, title }: PostImagePropsType) {
  const {uri, onError} = useTryThumbnailUrl(id);

  console.log("title", title, uri);

  return <Image source={{ uri }} style={style} onError={onError} />;
}

export default PostImage;
