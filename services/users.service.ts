import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export type UserType = {
  id: string;
  displayName: string | null;
  email: string | null;
};

export const createUser = async (user: UserType): Promise<void> => {
  try {
    console.log('[Users Service] Creating user:', { userId: user.id, displayName: user.displayName, email: user.email });
    
    const userRef = firestore().collection('users').doc(user.id);
    await userRef.set({
      displayName: user.displayName,
      email: user.email,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Create a list for the user
    const listRef = firestore().collection('lists').doc();
    await listRef.set({
      isPublished: false,
      posts: [],
      userId: user.id,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
      
    console.log('[Users Service] User and list created successfully:', user.id);
  } catch (error: any) {
    console.error('[Users Service] Error creating user:', { userId: user.id, error: error.message });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

export const deleteUser = async (): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      throw {
        code: 'auth/no-user',
        message: 'No authenticated user found',
      };
    }
    
    const userId = currentUser.uid;
    console.log('[Users Service] Deleting user:', { userId });
    
    // Find the user's list first
    const listsQuery = await firestore()
      .collection('lists')
      .where('userId', '==', userId)
      .get();
    
    if (!listsQuery.empty) {
      // Delete all lists associated with the user
      const deletePromises = listsQuery.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      console.log('[Users Service] Deleted', listsQuery.docs.length, 'list(s) for user:', userId);
    }
    
    console.log('[Users Service] Deleting user document:', userId);
    // Delete the user document
    const userRef = firestore().collection('users').doc(userId);
    await userRef.delete();
    
    console.log('[Users Service] Deleted user document:', userId);
    // Delete the Firebase Auth user
    await currentUser.delete();
    
    console.log('[Users Service] User and associated lists deleted successfully:', userId);
  } catch (error: any) {
    console.error('[Users Service] Error deleting user:', { error: error.message });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

