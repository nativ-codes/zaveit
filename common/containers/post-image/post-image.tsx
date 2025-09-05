import { Image } from "expo-image";
import { useTryThumbnailUrl } from "./post-image.hook";
import { PostImagePropsType } from "./post-image.type";

function PostImage({ id, style }: PostImagePropsType) {
  const uri = useTryThumbnailUrl(id);

  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

export default PostImage;
