import firestore from '@react-native-firebase/firestore';

export type PostType = {
  url: string;
  title: string | undefined;
  thumbnail: string | undefined;
};

export const savePost = async (userId: string, post: PostType): Promise<void> => {
  try {
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
        title: post.title || '',
        thumbnail: post.thumbnail || '',
        url: post.url || '',
        createdAt: new Date().toISOString(),
      })
    });
      
    console.log('[Posts Service] Post saved successfully');
  } catch (error: any) {
    console.error('[Posts Service] Error saving post:', { userId, error: error.message });
    throw {
      code: error.code,
      message: error.message,
    };
  }
}; 