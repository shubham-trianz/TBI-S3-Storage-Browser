import { apiClient } from "./client";
import { fetchAuthSession } from "aws-amplify/auth";

apiClient.interceptors.request.use(async (config) => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})


apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    return Promise.reject({
      status,
      message:
        error.response?.data?.message ||
        error.message ||
        'Unexpected error',
    });
  }
);





