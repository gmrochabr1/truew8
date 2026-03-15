import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = process.env.EXPO_PUBLIC_JWT_TOKEN;

  // Token injection is centralized here; replace with SecureStore/context lookup later.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
