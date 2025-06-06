import auth from '@react-native-firebase/auth';

export type RegisterResponseType = {
  user: any;
};

export type RegisterErrorType = {
  code: string;
  message: string;
};

export const register = async (
  email: string,
  password: string
): Promise<RegisterResponseType> => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    throw {
      code: error.code,
      message: error.message,
    } as RegisterErrorType;
  }
};
