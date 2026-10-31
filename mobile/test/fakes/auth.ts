type FakeUser = { uid: string };

const auth: { currentUser: FakeUser | null } = { currentUser: null };

export const getAuth = () => auth;

export const setCurrentUser = (user: FakeUser | null) => {
  auth.currentUser = user;
};
