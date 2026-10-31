type FakeUser = {
  uid: string;
  providerData?: { providerId: string }[];
  reauthenticateWithCredential?: (credential: unknown) => Promise<unknown>;
  delete?: () => Promise<void>;
};

const auth: {
  currentUser: FakeUser | null;
  revokeToken: (authorizationCode: string) => Promise<void>;
} = { currentUser: null, revokeToken: async () => {} };

export const getAuth = () => auth;

export const setCurrentUser = (user: FakeUser | null) => {
  auth.currentUser = user;
};

export const GoogleAuthProvider = {
  credential: (idToken: string) => ({ idToken }),
};

export const AppleAuthProvider = {
  credential: (idToken: string, nonce: string) => ({ idToken, nonce }),
};

export const reauthenticateWithCredential = (
  user: FakeUser,
  credential: unknown
) => user.reauthenticateWithCredential?.(credential);

export const signOut = async () => {
  // Like the native module, reject when nobody is signed in.
  if (!auth.currentUser) {
    throw Object.assign(new Error("No user currently signed in."), {
      code: "auth/no-current-user",
    });
  }
  auth.currentUser = null;
};
