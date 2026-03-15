import axios from 'axios';

import type { TranslationKey } from '@/src/i18n';

type AuthAction = 'login' | 'register';

type ErrorPayload = {
  message?: string;
};

const readApiMessage = (payload: unknown): string => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as ErrorPayload).message;
    if (typeof message === 'string') {
      return message.toLowerCase();
    }
  }
  return '';
};

export function getAuthErrorMessageKey(error: unknown, action: AuthAction): TranslationKey {
  if (!axios.isAxiosError(error)) {
    return 'auth.error';
  }

  if (!error.response) {
    return 'auth.errorNetwork';
  }

  const status = error.response.status;
  const apiMessage = readApiMessage(error.response.data);

  if (status === 401 && action === 'login') {
    return 'auth.errorInvalidCredentials';
  }

  if (status === 409 && action === 'register') {
    return 'auth.errorEmailExists';
  }

  if (status === 400) {
    if (apiMessage.includes('password')) {
      return 'auth.errorWeakPassword';
    }
    return 'auth.errorInvalidData';
  }

  return 'auth.error';
}
