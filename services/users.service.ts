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

export const getUser = async (userId: string): Promise<UserType | null> => {
  try {
    console.log('[Users Service] Fetching user:', userId);
    
    const userRef = firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('[Users Service] User not found:', userId);
      return null;
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    } as UserType;
    
    console.log('[Users Service] User fetched successfully:', { userId: userData.id, displayName: userData.displayName });
    return userData;
  } catch (error: any) {
    console.error('[Users Service] Error fetching user:', { userId, error: error.message });
    throw {
      code: error.code,
      message: error.message,
    };
  }
}; 