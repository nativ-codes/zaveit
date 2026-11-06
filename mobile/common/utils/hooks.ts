import { useAuth } from "@/config/contexts/auth.context";
import { keepPendingPost } from "@/config/storage/pending-post";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";

export const useShareIntent = () => {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!hasShareIntent || isLoading) {
      return;
    }

    if (isAuthenticated) {
      router.navigate("/share-intent");
      return;
    }

    // Signed out: keep only the link for after sign-in, nothing is scraped or tagged.
    if (shareIntent.webUrl) {
      keepPendingPost(shareIntent.webUrl);
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, isAuthenticated, isLoading, router, resetShareIntent]);
};
