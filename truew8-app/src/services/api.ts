import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

let authTokenGetter: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

export const setAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const isAuthEndpoint = requestUrl.startsWith("/auth/");
  const token = authTokenGetter();

  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? "";
    const isAuthEndpoint = requestUrl.startsWith("/auth/");
    const status = error.response?.status;

    if (status === 401 && !isAuthEndpoint) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);
