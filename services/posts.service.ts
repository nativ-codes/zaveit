import { PostType } from "@/types";
import auth from "@react-native-firebase/auth";
import firestore from '@react-native-firebase/firestore';

export const savePostService = async (post: PostType): Promise<void> => {
  try {
    const userId = auth().currentUser?.uid;
    console.log('[Posts Service] Saving post:', { userId, post });
    
    // Find the user's list
    const listsRef = firestore().collection('lists');
    const userListQuery = await listsRef.where('userId', '==', userId).limit(1).get();
    
    if (userListQuery.empty) {
      throw new Error('No list found for user');
    }

    const userList = userListQuery.docs[0];
    
    // Add the post to the list's posts array
    await userList.ref.update({
      userId: userId,
      posts: firestore.FieldValue.arrayUnion({
        id: post.id,
        title: post.title || '',
        thumbnail: post.thumbnail || '',
        url: post.url || '',
        tags: post.tags || [],
        createdAt: new Date().toISOString(),
      })
    });
      
    console.log('[Posts Service] Post saved successfully');
  } catch (error: any) {
    console.error('[Posts Service] Error saving post:', { error: error.message });
    throw {
      code: error.code,
      message: error.message,
    };
  }
}; 