import { ErrorHandler } from "@/config/errors";
import { getPosts } from "@/config/storage";
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

export const updateThumbnail = async (id: string): Promise<void> => {
  const posts = getPosts();
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return;
  }

  try {
    const metadata = await getMetadata({
      webUrl: post.url,
    });

    if (metadata.thumbnail) {
      await saveImageFromUrl(metadata.thumbnail, post.id);
    }
  } catch (error) {
    ErrorHandler.logError({
      location: "updateThumbnail",
      error: safelyPrintError(error),
      metadata: {
        id,
      },
    });
  }
};
