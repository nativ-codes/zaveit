import { forceHttps } from "@/common/utils/formatters";
import { getPosts, updatePost } from "@/config/storage/posts";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import { setThumbnailUrlService } from "@/services/posts.service";
import { makeThumbnail, uploadThumbnail } from "@/services/thumbnails.service";
import { PostType } from "@/types";

// Fetches a fresh picture and saves its new URL. The old file is left for the orphan script. Throws on failure.
export const reloadThumbnail = async (post: PostType): Promise<void> => {
  const { thumbnail } = await getMetadata({ webUrl: post.url });
  if (!thumbnail) {
    throw new Error("No picture found for this Post");
  }

  const thumbnailUrl = await uploadThumbnail(await makeThumbnail(forceHttps(thumbnail)));
  await setThumbnailUrlService(post.id, thumbnailUrl);
  // Re-read, so a sync that changed the Post during the upload isn't undone.
  const current = getPosts().find(({ id }) => id === post.id) ?? post;
  await updatePost({ ...current, thumbnailUrl });
};
