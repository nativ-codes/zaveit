import { forceHttps } from "@/common/utils/formatters";
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
  // The posts listener picks up the new URL.
  await setThumbnailUrlService(post.id, thumbnailUrl);
};
