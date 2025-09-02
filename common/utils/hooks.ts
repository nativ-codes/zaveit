import { getPosts, updatePost } from "@/config/storage";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect, useState } from "react";
import { saveImageFromUrl } from "./files";

export const useShareIntent = () => {
  const router = useRouter();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent) {
      router.navigate("/share-intent");
    }
  }, [hasShareIntent, router]);
};

export const useRefreshPost = (id: string) => {
  const [tryRefreshPost, setTryRefreshPost] = useState(false);

  useEffect(() => {
    const handleRefreshPost = async () => {
      try {
        const posts = getPosts();
        const post = posts.find((p) => p.id === id);

        if (!post) {
          return;
        }
  
        const metadata = await getMetadata({
          webUrl: post.url,
        });

        if (metadata) {
          updatePost({
            ...post,
            ...metadata,
            thumbnail: await saveImageFromUrl(metadata.thumbnail, post.id) || "",
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error("Error refreshing post", error);
      } finally {
        console.log("Refreshed post", id);
      }
    };

    if (tryRefreshPost) {
      handleRefreshPost();
    }
  }, [tryRefreshPost, id]);

  const handleOnError = () => {
    setTryRefreshPost(true);
  };

  return handleOnError;
};