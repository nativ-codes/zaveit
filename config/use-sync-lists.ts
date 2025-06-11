import { StoredShareIntent } from '@/types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { saveShareIntents } from './storage/persistent';

export const useSyncLists = () => {
  const syncLists = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.log('[Sync Lists] No user found');
      return;
    }

    try {
      console.log('[Sync Lists] Starting sync for user:', currentUser.uid);
      
      const listsRef = firestore().collection('lists');
      const userListsQuery = await listsRef.where('userId', '==', currentUser.uid).get();
      
      if (userListsQuery.empty) {
        console.log('[Sync Lists] No lists found for user:', currentUser.uid);
        return;
      }

      const lists = userListsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('[Sync Lists] Found lists:', lists);
      
      // Extract posts from the first list and save them as share intents
      if (lists.length > 0 && 'posts' in lists[0]) {
        const shareIntents = lists[0].posts as StoredShareIntent[];
        saveShareIntents(shareIntents);
        console.log('[Sync Lists] Saved share intents:', shareIntents.length);
      }

      return lists;
    } catch (error: any) {
      console.error('[Sync Lists] Error syncing lists:', error.message);
      throw {
        code: error.code,
        message: error.message,
      };
    }
  };

  return { syncLists };
};
