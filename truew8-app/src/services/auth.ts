import { apiClient } from '@/src/services/api';

type AuthPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  email: string;
};

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}
