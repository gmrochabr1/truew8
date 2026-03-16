import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
let authTokenGetter: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};
let localeGetter: () => string = () => 'pt-BR';

export const setAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export const setLocaleGetter = (getter: () => string) => {
  localeGetter = getter;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const isAuthEndpoint = requestUrl.startsWith("/auth/");
  const token = authTokenGetter();
  const locale = localeGetter();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['Accept-Language'] = locale;
  if (timezone) {
    config.headers['X-User-Timezone'] = timezone;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url ?? "";
    const isAuthEndpoint = requestUrl.startsWith("/auth/");
    const status = error.response?.status;

    if (status === 401 && !isAuthEndpoint && !error.config?._retry) {
      try {
        error.config._retry = true;
        await apiClient.post('/auth/refresh');
        return apiClient.request(error.config);
      } catch {
        unauthorizedHandler();
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);
