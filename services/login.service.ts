import auth from '@react-native-firebase/auth';

export type LoginResponseType = {
  user: any;
};

export type LoginErrorType = {
  code: string;
  message: string;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponseType> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    throw {
      code: error.code,
      message: error.message,
    } as LoginErrorType;
  }
};
