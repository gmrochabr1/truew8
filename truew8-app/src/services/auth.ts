import { apiClient } from '@/src/services/api';

type AuthPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token?: string | null;
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

export async function getCurrentSession(): Promise<AuthResponse> {
  const { data } = await apiClient.get<AuthResponse>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
