const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_VERSION = "v1";

export const ApiEndpoints = {
  tags: `${API_URL}/${API_VERSION}/tags`,
  metadata: `${API_URL}/${API_VERSION}/metadata`,
};
