import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";

type UseShareIntentPropsType = {
  isAuthenticated: boolean;
};

export const useShareIntent = ({ isAuthenticated }: UseShareIntentPropsType) => {
  const router = useRouter();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent) {
      if (isAuthenticated) {
        router.navigate("/share-intent");
      } else {
        router.navigate("/login");
      }
    }
  }, [hasShareIntent, router, isAuthenticated]);
};
