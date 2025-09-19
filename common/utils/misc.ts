import { ErrorHandler } from "@/config/errors";
import { getPosts, setThumbnailUrl } from "@/config/storage";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import { safelyPrintError } from "./error-parsers";
import { saveImageFromUrl } from "./files";

export const noop = () => {};

type ToggleTagType = {
  tags: string[];
  tag: string;
};

export const toggleTag = ({ tags, tag }: ToggleTagType) =>
  tags.includes(tag) ? tags.filter((t) => t !== tag) : [...(tags || []), tag];

export const updateThumbnail = async (id: string): Promise<string> => {
  const posts = getPosts();
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return '';
  }

  try {
    const metadata = await getMetadata({
      webUrl: post.url
    });

    if (metadata) {
      const thumbnailUrl = (await saveImageFromUrl(metadata.thumbnail, post.id)) || "";
      setThumbnailUrl({id, url: thumbnailUrl});
      
      return thumbnailUrl;
    } else {
      return '';
    }
  } catch (error) {
    ErrorHandler.logError({
      location: "updateThumbnail",
      error: safelyPrintError(error),
      metadata: {
        id,
      },
    });
    return '';
  }
}