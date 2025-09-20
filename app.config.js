module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      UPLOAD_STORE_FILE: process.env.EXPO_PUBLIC_UPLOAD_STORE_FILE,
      UPLOAD_KEY_ALIAS: process.env.EXPO_PUBLIC_UPLOAD_KEY_ALIAS,
      UPLOAD_STORE_PASSWORD: process.env.EXPO_PUBLIC_UPLOAD_STORE_PASSWORD,
      UPLOAD_KEY_PASSWORD: process.env.EXPO_PUBLIC_UPLOAD_KEY_PASSWORD,
    },
  };
};
